-- Archive-then-delete cleanup for comparisons whose source URLs are not on
-- the supported Japanese real estate site whitelist. The Feed has been
-- polluted with non-JP / non-real-estate content (e.g. Mercedes SUVs,
-- snowboards, London apartments) and bead home-duo-insight-b5v restricts
-- new submissions to a known-good host list. This migration removes the
-- existing pollution.
--
-- HEURISTIC: a comparison is considered "non-JP" when EITHER of its two
-- stored listing URLs (comparisons.property_url_a / property_url_b) does
-- NOT match a host in the whitelist (suumo.jp, homes.co.jp, lifull.com,
-- athome.co.jp, mansion-review.jp — including any subdomain). URLs are
-- matched by extracting the host with regexp_match(url, '^https?://([^/]+)').
-- Comparisons without stored URLs (NULL/empty) are considered legacy/seed
-- data and are LEFT IN PLACE — we cannot determine their origin.
--
-- The archive table uses a JSONB blob for the comparison row so we can
-- ship safely even if the comparisons schema drifts (sibling beads have
-- been adding columns; capturing the row as JSON via to_jsonb keeps this
-- migration forward-compatible).

BEGIN;

-- 1. Archive table (forward-compatible JSONB capture).
CREATE TABLE IF NOT EXISTS public.comparisons_archive_non_jp (
  id UUID PRIMARY KEY,
  comparison_row JSONB NOT NULL,
  property_a_row JSONB,
  property_b_row JSONB,
  recommendation_rows JSONB,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL DEFAULT 'unsupported_site_host'
);

COMMENT ON TABLE public.comparisons_archive_non_jp IS
  'Cold archive of comparison rows (and their linked properties + recommendations) removed by the b5v whitelist cleanup. Restored as JSONB blobs to survive schema drift.';

-- 2. Identify offending comparison ids in a temp table so the same set is
--    used for archive + delete (cheaper than re-evaluating the regex).
CREATE TEMP TABLE _b5v_non_jp_comparisons ON COMMIT DROP AS
SELECT c.id
FROM public.comparisons c
WHERE
  -- Only consider rows where we actually have URL evidence to judge by.
  (c.property_url_a IS NOT NULL AND c.property_url_a <> ''
   AND NOT (
     lower(coalesce((regexp_match(c.property_url_a, '^https?://([^/]+)'))[1], ''))
       ~ '(^|\.)(suumo\.jp|homes\.co\.jp|lifull\.com|athome\.co\.jp|mansion-review\.jp)$'
   ))
  OR
  (c.property_url_b IS NOT NULL AND c.property_url_b <> ''
   AND NOT (
     lower(coalesce((regexp_match(c.property_url_b, '^https?://([^/]+)'))[1], ''))
       ~ '(^|\.)(suumo\.jp|homes\.co\.jp|lifull\.com|athome\.co\.jp|mansion-review\.jp)$'
   ));

-- 3. Insert archive rows (comparison + linked properties + linked
--    recommendations, all as JSONB).
INSERT INTO public.comparisons_archive_non_jp
  (id, comparison_row, property_a_row, property_b_row, recommendation_rows)
SELECT
  c.id,
  to_jsonb(c.*),
  to_jsonb(pa.*),
  to_jsonb(pb.*),
  COALESCE(
    (SELECT jsonb_agg(to_jsonb(r.*))
     FROM public.recommendations r
     WHERE r.comparison_id = c.id),
    '[]'::jsonb
  )
FROM public.comparisons c
JOIN _b5v_non_jp_comparisons n ON n.id = c.id
LEFT JOIN public.properties pa ON pa.id = c.property_a_id
LEFT JOIN public.properties pb ON pb.id = c.property_b_id
ON CONFLICT (id) DO NOTHING;

-- 4. Capture the property ids before we drop the comparisons (we need them
--    to clean orphans afterwards). property_a_id / property_b_id are
--    NOT NULL on comparisons.
CREATE TEMP TABLE _b5v_candidate_property_ids ON COMMIT DROP AS
SELECT DISTINCT pid FROM (
  SELECT c.property_a_id AS pid
  FROM public.comparisons c
  JOIN _b5v_non_jp_comparisons n ON n.id = c.id
  UNION ALL
  SELECT c.property_b_id AS pid
  FROM public.comparisons c
  JOIN _b5v_non_jp_comparisons n ON n.id = c.id
) s
WHERE pid IS NOT NULL;

-- 5. Delete the comparisons (recommendations cascade if their FK uses
--    ON DELETE CASCADE; if not, the explicit delete below covers them).
DELETE FROM public.recommendations
WHERE comparison_id IN (SELECT id FROM _b5v_non_jp_comparisons);

DELETE FROM public.comparisons
WHERE id IN (SELECT id FROM _b5v_non_jp_comparisons);

-- 6. Drop now-orphaned properties (those that are no longer referenced by
--    any remaining comparison). A property may legitimately be referenced
--    by a JP comparison too, in which case we keep it.
DELETE FROM public.properties p
WHERE p.id IN (SELECT pid FROM _b5v_candidate_property_ids)
  AND NOT EXISTS (
    SELECT 1 FROM public.comparisons c2
    WHERE c2.property_a_id = p.id OR c2.property_b_id = p.id
  );

COMMIT;
