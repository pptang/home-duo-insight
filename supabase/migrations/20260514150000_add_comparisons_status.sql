-- home-duo-insight-7st: report status mechanism so the public Feed can hide
-- broken/in-flight comparisons.
--
-- Adds a status enum (processing/failed/published/archived) + failure_reason
-- column to comparisons, then back-fills existing rows:
--   * 'failed'    – rows whose joined property data is clearly broken
--                   (¥0 / NULL prices on both sides, placeholder names like
--                   '物件 A' / '物件 B', or one of the property rows is missing).
--   * 'published' – everything else (existing rows are assumed to be the
--                   currently-visible Feed; the new pipeline will start writing
--                   'processing' explicitly).
--
-- New rows default to 'processing'. The analyze-properties / generate-recommendation
-- edge functions are responsible for transitioning to 'published' on success or
-- 'failed' (with a failure_reason) on failure.

-- 1. Status enum.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comparison_status') THEN
    CREATE TYPE public.comparison_status AS ENUM (
      'processing',
      'failed',
      'published',
      'archived'
    );
  END IF;
END$$;

-- 2. Columns. Default to 'processing' so newly-inserted rows have to be
-- explicitly published by the edge functions.
ALTER TABLE public.comparisons
  ADD COLUMN IF NOT EXISTS status public.comparison_status NOT NULL DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS failure_reason text;

-- 3. Back-fill. Treat the placeholder/¥0 shape as 'failed', everything else as
-- 'published' so the existing public Feed isn't suddenly emptied.
WITH classified AS (
  SELECT
    c.id,
    pa.property_name AS a_name,
    pa.price_yen     AS a_price,
    pb.property_name AS b_name,
    pb.price_yen     AS b_price,
    (pa.id IS NULL OR pb.id IS NULL) AS missing_property
  FROM public.comparisons c
  LEFT JOIN public.properties pa ON pa.id = c.property_a_id
  LEFT JOIN public.properties pb ON pb.id = c.property_b_id
)
UPDATE public.comparisons c
SET
  status         = 'failed',
  failure_reason = CASE
    WHEN cl.missing_property                                    THEN 'missing_property_row'
    WHEN COALESCE(cl.a_price, 0) = 0 AND COALESCE(cl.b_price, 0) = 0 THEN 'zero_price_both_sides'
    WHEN cl.a_name IS NULL OR cl.b_name IS NULL                 THEN 'missing_property_name'
    WHEN trim(cl.a_name) IN ('物件 A', '物件A', 'Property A')
      OR trim(cl.b_name) IN ('物件 B', '物件B', 'Property B')   THEN 'placeholder_property_name'
    ELSE 'unknown_legacy_failure'
  END
FROM classified cl
WHERE cl.id = c.id
  AND (
        cl.missing_property
     OR (COALESCE(cl.a_price, 0) = 0 AND COALESCE(cl.b_price, 0) = 0)
     OR cl.a_name IS NULL OR cl.b_name IS NULL
     OR trim(cl.a_name) IN ('物件 A', '物件A', 'Property A')
     OR trim(cl.b_name) IN ('物件 B', '物件B', 'Property B')
      );

-- Anything still on the default 'processing' from the back-fill is a real,
-- displayable legacy row → mark it 'published'. (New inserts after this
-- migration will *also* land at 'processing', but the edge functions will
-- transition them within the same request, so this only affects historical
-- rows that existed before the column was added.)
UPDATE public.comparisons
SET status = 'published'
WHERE status = 'processing';

-- 4. Index for the hot Feed query path (status='published' ORDER BY created_at).
CREATE INDEX IF NOT EXISTS comparisons_status_created_at_idx
  ON public.comparisons (status, created_at DESC);
