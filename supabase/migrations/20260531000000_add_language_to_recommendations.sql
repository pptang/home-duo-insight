-- bead home-duo-insight-elg: persist the authored language of each recommendation.
--
-- A recommendation is generated once, in the author's UI locale at generation
-- time (src/lib/comparisonFlow.ts getNormalizedLanguage), and that language is
-- FIXED for the report. Because comparisons are deduped per (URL pair, UTC date)
-- and the recommendation is persisted + reused, every later viewer sees the
-- report in its authored language regardless of their own locale. Policy (option
-- c): we do NOT regenerate per viewer; we record the authored language here so the
-- viewer UI can surface a notice when the viewer's locale differs.
--
-- Nullable: rows created before this migration have an unknown authored language
-- and are left NULL (the UI shows no notice for them).

ALTER TABLE public.recommendations
  ADD COLUMN language TEXT;

COMMENT ON COLUMN public.recommendations.language IS
  'Authored language of this report (''en'' | ''ja''), fixed at generation time from the author''s UI locale. The report is never regenerated per viewer (bead home-duo-insight-elg). NULL = unknown (pre-migration rows).';
