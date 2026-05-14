-- home-duo-insight-mc4: deduplicate comparison reports for the same listing
-- pair within a 24-hour window.
--
-- This migration:
--   1. Adds `pair_key` (text) and `date_bucket` (date) columns to
--      `comparisons`.
--   2. Defines a Postgres helper that normalizes a listing URL for dedup
--      keying (strips tracking params, lowercases hostname, removes the
--      fragment, sorts kept query params, trims the trailing slash).
--   3. Back-fills both columns for every existing row using the helper +
--      `created_at::date AT TIME ZONE 'UTC'`.
--   4. Archives existing duplicates per `(pair_key, date_bucket)` keeping
--      the most-viewed (then oldest) row per bucket. Archived rows reuse
--      the `status='archived'` enum from bead 7st so the Feed (which
--      filters `status='published'`) drops them automatically.
--   5. Adds a partial unique index over `(pair_key, date_bucket)` that
--      ignores `archived` / `failed` rows, so the edge function can rely
--      on it as a hard guard against re-introducing same-day duplicates
--      via races.
--
-- The keep-rule is "most-viewed, then oldest" — `view_count` first because
-- a row with engagement is more valuable to preserve, `created_at ASC`
-- as a tiebreaker so we don't churn permalinks when there's no signal.

-- 1. Helper: stable URL canonicalization. Idempotent so re-running the
-- migration in a dev reset stays safe. SET search_path is explicit so the
-- function survives schema-search-path tightening in newer Supabase images.
CREATE OR REPLACE FUNCTION public.comparisons_normalize_listing_url(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_trim   text;
  v_scheme text;
  v_rest   text;
  v_authority text;
  v_path   text;
  v_query  text;
  v_host   text;
  v_port   text;
  v_kv     text;
  v_key    text;
  v_val    text;
  v_parts  text[];
  v_kept   text[] := ARRAY[]::text[];
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;

  v_trim := btrim(input);
  IF v_trim = '' THEN
    RETURN NULL;
  END IF;

  -- Split scheme://rest. Anything that doesn't look like http(s) → return
  -- lowercased as-is (defensive fallback; the whitelist already filters
  -- non-http schemes at insert time).
  IF v_trim ~* '^https?://' THEN
    v_scheme := lower(split_part(v_trim, '://', 1));
    v_rest   := substring(v_trim from position('://' in v_trim) + 3);
  ELSE
    RETURN lower(v_trim);
  END IF;

  -- Strip fragment.
  v_rest := split_part(v_rest, '#', 1);

  -- Split authority / path-and-query on first '/'.
  IF position('/' in v_rest) = 0 THEN
    v_authority := v_rest;
    v_path := '/';
    v_query := '';
  ELSE
    v_authority := substring(v_rest from 1 for position('/' in v_rest) - 1);
    v_path := substring(v_rest from position('/' in v_rest));
    -- Path may still carry the query string.
    IF position('?' in v_path) > 0 THEN
      v_query := substring(v_path from position('?' in v_path) + 1);
      v_path  := substring(v_path from 1 for position('?' in v_path) - 1);
    ELSE
      v_query := '';
    END IF;
  END IF;

  -- Lowercase host, drop trailing dot, drop default port.
  IF position(':' in v_authority) > 0 THEN
    v_host := lower(split_part(v_authority, ':', 1));
    v_port := split_part(v_authority, ':', 2);
  ELSE
    v_host := lower(v_authority);
    v_port := '';
  END IF;
  IF right(v_host, 1) = '.' THEN
    v_host := left(v_host, length(v_host) - 1);
  END IF;
  IF (v_scheme = 'http' AND v_port = '80')
     OR (v_scheme = 'https' AND v_port = '443') THEN
    v_port := '';
  END IF;

  -- Trim trailing slash unless path is just '/'.
  IF v_path = '' THEN
    v_path := '/';
  ELSIF length(v_path) > 1 AND right(v_path, 1) = '/' THEN
    v_path := left(v_path, length(v_path) - 1);
  END IF;

  -- Drop tracking params, keep the rest, sort lexicographically.
  IF v_query <> '' THEN
    v_parts := string_to_array(v_query, '&');
    FOREACH v_kv IN ARRAY v_parts LOOP
      IF v_kv = '' THEN
        CONTINUE;
      END IF;
      IF position('=' in v_kv) > 0 THEN
        v_key := substring(v_kv from 1 for position('=' in v_kv) - 1);
        v_val := substring(v_kv from position('=' in v_kv) + 1);
      ELSE
        v_key := v_kv;
        v_val := '';
      END IF;
      IF lower(v_key) ~ '^utm_'
         OR lower(v_key) IN (
              'gclid','fbclid','msclkid','mc_cid','mc_eid','yclid',
              '_ga','_gl','ref','ref_src','referrer','trflg','trk'
            )
      THEN
        CONTINUE;
      END IF;
      v_kept := array_append(v_kept, v_key || '=' || v_val);
    END LOOP;
    -- Sort. SELECT … ORDER BY into array via subquery.
    IF array_length(v_kept, 1) IS NOT NULL THEN
      SELECT array_agg(kv ORDER BY kv) INTO v_kept FROM unnest(v_kept) kv;
      v_query := '?' || array_to_string(v_kept, '&');
    ELSE
      v_query := '';
    END IF;
  END IF;

  RETURN v_scheme || '://'
       || v_host
       || CASE WHEN v_port <> '' THEN ':' || v_port ELSE '' END
       || v_path
       || v_query;
END;
$$;

-- Pair-key builder: normalize both URLs, sort lexicographically, join with '|'.
CREATE OR REPLACE FUNCTION public.comparisons_build_pair_key(url_a text, url_b text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
  a text := public.comparisons_normalize_listing_url(url_a);
  b text := public.comparisons_normalize_listing_url(url_b);
BEGIN
  IF a IS NULL OR b IS NULL OR a = '' OR b = '' THEN
    RETURN NULL;
  END IF;
  IF a < b THEN
    RETURN a || '|' || b;
  ELSE
    RETURN b || '|' || a;
  END IF;
END;
$$;

-- 2. Columns. Nullable so legacy rows with no URLs (the pre-#urls era of
-- comparisons) stay representable; the unique index is partial and skips
-- NULLs naturally.
ALTER TABLE public.comparisons
  ADD COLUMN IF NOT EXISTS pair_key    text,
  ADD COLUMN IF NOT EXISTS date_bucket date;

-- 3. Backfill.
UPDATE public.comparisons
SET
  pair_key    = public.comparisons_build_pair_key(property_url_a, property_url_b),
  date_bucket = (created_at AT TIME ZONE 'UTC')::date
WHERE pair_key IS NULL
   OR date_bucket IS NULL;

-- 4. Archive existing duplicates. For each (pair_key, date_bucket) group,
-- keep the row with the highest view_count, breaking ties with the oldest
-- created_at. Don't touch already-archived/failed rows — they're already
-- hidden from the Feed and re-stamping them would obscure their original
-- failure_reason. Archived dupes get failure_reason='duplicate_pair_24h'
-- so we can audit the cleanup.
WITH ranked AS (
  SELECT
    id,
    pair_key,
    date_bucket,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY pair_key, date_bucket
      ORDER BY view_count DESC NULLS LAST, created_at ASC, id ASC
    ) AS rn
  FROM public.comparisons
  WHERE pair_key IS NOT NULL
    AND date_bucket IS NOT NULL
    AND status IN ('processing', 'published')
)
UPDATE public.comparisons c
SET
  status         = 'archived',
  failure_reason = COALESCE(c.failure_reason, 'duplicate_pair_24h')
FROM ranked r
WHERE r.id = c.id
  AND r.rn > 1;

-- 5. Partial unique index. Skips NULL pair_key (legacy rows without URLs)
-- AND archived/failed rows (so we can intentionally keep historical
-- duplicates around as evidence without blocking a fresh insert later).
CREATE UNIQUE INDEX IF NOT EXISTS comparisons_pair_key_date_bucket_uniq
  ON public.comparisons (pair_key, date_bucket)
  WHERE pair_key IS NOT NULL
    AND date_bucket IS NOT NULL
    AND status NOT IN ('archived', 'failed');

-- Read path: the analyze-properties edge function looks up an existing row
-- by (pair_key, date_bucket) BEFORE inserting. A plain b-tree on the same
-- expression makes that probe an index-only seek instead of relying on the
-- partial unique index (which Postgres can use but only when the WHERE
-- clause matches exactly).
CREATE INDEX IF NOT EXISTS comparisons_pair_key_date_bucket_idx
  ON public.comparisons (pair_key, date_bucket)
  WHERE pair_key IS NOT NULL
    AND date_bucket IS NOT NULL;
