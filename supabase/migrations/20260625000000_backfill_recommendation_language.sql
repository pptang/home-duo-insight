-- bead home-duo-insight-q3t: backfill recommendations.language for rows created
-- before the column shipped.
--
-- The language column (bead home-duo-insight-elg, migration 20260531000000) was
-- added nullable; every row created before it is NULL. The forward write path
-- (src/lib/comparisonFlow.ts -> generate-recommendation edge function) already
-- persists language on new rows, so this is a one-time backfill of legacy data.
-- Without it the explicit signal is unusable: the viewer language-mismatch notice
-- (elg) never fires, and <html lang> (bead home-duo-insight-24c) has to fall back
-- to a render-time kana heuristic instead of reading the column.
--
-- DETECTION: a report is authored once, entirely in the author's locale. Hiragana
-- (U+3040-309F) + Katakana (U+30A0-30FF) are unique to Japanese and never appear
-- in an English report's prose, so any kana in the report body is a
-- high-confidence 'ja' signal. This mirrors detectReportLanguage() in
-- src/pages/ComparisonDetail.tsx exactly -- same fields (final_recommendation +
-- ai_points), same kana range -- so the persisted column and the client fallback
-- always agree.
--
-- We deliberately do NOT inspect summary_table: its 'badge' field can hold a lone
-- kanji even on an English report (e.g. badge '安' for "Cheap"). Kanji
-- (U+4E00-9FFF) sit outside the kana range above, so such badges never influence
-- the classification.
--
-- Validated against production data (read-only) before shipping: of 76 NULL rows,
-- 75 classify 'ja' and 1 ('2c02c1b1', an English-authored report) classifies 'en'.
--
-- Idempotent: only rows still NULL are touched, so re-running is a no-op.

UPDATE public.recommendations
SET language = CASE
  WHEN final_recommendation ~ '[぀-ヿ]'
    OR coalesce(ai_points::text, '') ~ '[぀-ヿ]'
  THEN 'ja'
  ELSE 'en'
END
WHERE language IS NULL;
