# Fix locale leak on cached reports — design (home-duo-insight-elg)

## Problem

The first comparison for a given (URL pair, UTC date) bucket is generated once and
its recommendation is **persisted and reused** for every later viewer. The report
language is read from `i18n.language` at generation time (`comparisonFlow.ts`
`getNormalizedLanguage()`), but the `recommendations` table has **no `language`
column**. So if an earlier session generated the report while the app was in
English, every later viewer sees English regardless of their own locale.

Reported by Jasper 2026-05-25 (screenshot IMG_2072): site default should be
Japanese, but the first comparison showed English text.

## Policy (option c — documented as expected)

A recommendation is generated **once**, in the author's UI locale at generation
time, and that language is **fixed** for the report. Viewers in a different locale
see the report in its authored language. We do **not** regenerate per viewer.

We persist the authored language and show the viewer a notice **only when their
current locale differs** from the report's authored language.

This is consistent with prior direction in the repo (the `clean_non_jp_reports`
migration and the bead-0fm "force EN field labels" work): one report, one language.

## Changes

1. **DB migration** `supabase/migrations/20260531000000_add_language_to_recommendations.sql`
   - `ALTER TABLE public.recommendations ADD COLUMN language TEXT;`
   - Nullable. Existing rows stay `NULL` (= unknown authored language).
   - `COMMENT ON COLUMN` documenting the fixed-at-authoring policy and `'en' | 'ja'`
     value domain.

2. **Edge function** `supabase/functions/generate-recommendation/index.ts`
   - Already receives & validates `language` (defaults `'en'`).
   - Add `language` to the `recommendationData` object inserted into
     `recommendations`.

3. **Client** `src/lib/comparisonFlow.ts`
   - No behavior change. Keep `getNormalizedLanguage()` deriving from
     `i18n.language`.
   - Add a doc comment: report language is fixed at authoring and not regenerated
     per viewer (links bead elg).

4. **Viewer** `src/pages/ComparisonDetail.tsx`
   - Add `language` to the `recommendations(...)` PostgREST select and to the
     `AIRecommendation` interface (`language?: string | null`).
   - Normalize the viewer's current `i18n.language` to `'en' | 'ja'`.
   - If `recommendation.language` is present **and differs** from the viewer's
     normalized locale, render a small inline notice above the summary.
   - Add i18n strings under `comparisonDetail` (en + ja), e.g.
     `comparisonDetail.languageNotice` with an interpolated `{{language}}` name
     (the human-readable language name, also localized).

5. **Types** `src/integrations/supabase/types.ts`
   - Add `language: string | null` to the `recommendations` Row/Insert/Update so
     the build stays type-safe (codegen not assumed wired locally).

## Out of scope

- Per-viewer regeneration (that was option a/b).
- A language selector UI on the compare form (the rejected "explicit selector").
- Backfilling `NULL` languages — treated as "unknown" → no notice shown.

## Verification

- `npm run build` / typecheck passes.
- Manual smoke (e2e-smoke skill): generate a report with UI in EN, switch UI to JP,
  confirm the mismatch notice appears above the summary; switch back to EN, confirm
  it disappears. A report whose `language` is `NULL` shows no notice in any locale.
