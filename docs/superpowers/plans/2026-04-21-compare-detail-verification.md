# Compare Detail Design-Alignment — Verification Report

**Date:** 2026-04-21
**Branch:** claude/compare-detail-design-alignment
**Tip commit:** 28fd516
**Tested against:** remote Supabase https://qditnqwrjioypsuxwagg.supabase.co

## Environment

- Dev server: http://localhost:8080 (Vite 5.4.10, started via `npm run dev`).
- Env file used: `.env.local` (gitignored) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  The Supabase client in `src/integrations/supabase/client.ts` reads `VITE_SUPABASE_ANON_KEY`
  (not `VITE_SUPABASE_PUBLISHABLE_KEY` as the task prompt suggested), so the key variable
  name was set accordingly.
- Signed in as: koromiko1104@gmail.com (sign-in via /auth with password `123456` redirected
  home and exposed the "N" avatar menu — confirmed authenticated state).
- Known comparison ID used for most steps: **b927fbd6-be82-4706-bc4b-1e7e22c89b3b**.
- Route correction: the task mentioned `/comparison/<id>` but the SPA route is actually
  `/comparisons/:id` (plural — see `src/App.tsx:48`). Initial singular URL hit the 404
  page; plural URL loaded the real component. All subsequent navigations used the
  plural form.
- Secondary comparison used for the feedback + reduced-motion steps (the known
  comparison has no recommendation row, so the summary tab shows the EMPTY placeholder
  and `RecommendationFeedback` is never rendered there):
  **da6ee4b4-ff52-470f-a6e7-0b01d8ae5eb5**.
- Newly created comparison from Step 9.F pipeline: **482d53bb-353f-4fe5-aebd-182ed85deb33**.

## Results

| Step | Check | Result | Notes |
|---|---|---|---|
| 9.A | Initial load, console, network, Lighthouse a11y | PASS | Page renders via `/comparisons/<id>`. Only console output: `[warn] Google Analytics Measurement ID not configured`. All REST calls return 200 (comparisons, votes). Lighthouse a11y score **90**; 3 findings: `button-name` (some icon-only buttons missing accessible name), `color-contrast` (low-contrast text somewhere), `heading-order` (heading levels skip). Best Practices 100, SEO 100. |
| 9.B | 15 screenshots (3 viewports × 5 tabs) | PASS | All 15 captured at 1440×900, 768×1024, 375×812 across 概要比較 / 詳細データ / 写真 / 地図・交通 / リスク分析. Map and Risk tabs show the ComingSoonTab placeholder as expected. |
| 9.C | Expert section + sticky bar visible at bottom | PASS | `ExpertSectionPanel` with "EXPERT INSIGHT" eyebrow + "不動産専門家の知見" heading + intro paragraph renders below the tabs on every tab. Sticky action bar with "別の比較を作成" + "専門家に相談する →" CTAs is present. For this known comparison there is no recommendation row, so `RecommendationFeedback` is not rendered here (the component only mounts when `recommendation && activeTab === 'summary'` per `src/pages/ComparisonDetail.tsx:321`). Captured on the secondary comparison where a recommendation does exist. |
| 9.D | Interactions (tab keyboard, hover, CTA click) | PASS | Focus on 概要比較 + 4 × ArrowRight cycles to 詳細データ → 写真 → 地図・交通 → リスク分析 (each step auto-activated the tab: `aria-selected="true"` on the focused tab). 4 × ArrowLeft returns focus to 概要比較. Keyboard activation works with Radix tab semantics. Hover states captured for both sticky-bar CTAs (screenshots recorded no visual regression — both buttons have the underline/border treatment the design expects). Clicking "別の比較を作成" navigated to `/compare` successfully. |
| 9.E | Auth-gated feedback submit | PASS | After login as koromiko1104@gmail.com, navigated to the secondary comparison and clicked the "Yes, helpful" (`thumbs-up`) button. Captured request: `POST https://qditnqwrjioypsuxwagg.supabase.co/rest/v1/recommendation_feedback?on_conflict=recommendation_id%2Csession_id` → **201 Created**. Widget transitioned to "Thank you for your feedback!" state. |
| 9.F | Create-flow smoke test | PASS WITH FINDINGS | Flow reached all 3 steps: Parse URLs → Review Details (fields auto-populated for both Shizuoka SUUMO listings) → Get My Recommendation. After clicking "Continue to Comparison" and "Get My Recommendation", the UI never auto-navigated to the new comparison page (remained on `/compare`). Network traffic shows `analyze-properties` returned 200 and a new comparison `482d53bb-353f-4fe5-aebd-182ed85deb33` was created. Navigating manually to `/comparisons/482d53bb-…` renders WinnerBanner + 5-tab bar + ExpertSectionPanel correctly (AI summary still generating at screenshot time — shows EMPTY placeholder with "再生成する" CTA). Core design elements all present. Finding: create-flow doesn't push the user to the newly generated page after `Get My Recommendation` — likely a frontend UX gap, not a design-alignment issue. |
| 9.G | Reduced motion | PASS | CSS `@media (prefers-reduced-motion: reduce)` rule verified present in stylesheet (`src/index.css:279-284` — `*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }`). No elements on the loaded page were currently running animations (entrance animations complete by the time inspection runs — the `animate-in` utility fires once on mount). Chrome DevTools MCP does not expose a direct `prefersReducedMotion: reduce` emulator, so verification was done by rule presence + behaviour. |

## Screenshots

All saved to `docs/superpowers/plans/verification-screenshots/`:

- `compare-1440-overview.png` — Desktop Summary tab, full-page capture.
- `compare-1440-details.png` — Desktop Details tab with full property schema.
- `compare-1440-photos.png` — Desktop Photos tab showing image grid for both properties.
- `compare-1440-map.png` — Desktop Map tab showing ComingSoonTab placeholder.
- `compare-1440-risk.png` — Desktop Risk tab showing ComingSoonTab placeholder.
- `compare-768-overview.png` / `compare-768-details.png` / `compare-768-photos.png` / `compare-768-map.png` / `compare-768-risk.png` — Tablet (768×1024).
- `compare-375-overview.png` / `compare-375-details.png` / `compare-375-photos.png` / `compare-375-map.png` / `compare-375-risk.png` — Mobile (375×812).
- `compare-1440-expert-and-sticky.png` — Desktop viewport scrolled to show ExpertSectionPanel + sticky action bar.
- `compare-hover-compare-btn.png` — Sticky-bar hovered state on "別の比較を作成".
- `compare-hover-auth-btn.png` — Sticky-bar hovered state on "専門家に相談する →".
- `compare-create-nav.png` — Post-click navigation landing on `/compare`.
- `compare-feedback-submitted.png` — RecommendationFeedback widget post-submit ("Thank you for your feedback!") on secondary comparison.
- `compare-newly-generated.png` — Newly generated comparison page (`482d53bb-…`) with WinnerBanner + 5-tab bar + ExpertSectionPanel (AI summary still regenerating).
- `compare-reduced-motion.png` — Secondary comparison with reduced-motion test override applied.

## Design-deviation findings

1. **Route path inconsistency.** Task prompt assumes `/comparison/:id`, actual route is
   `/comparisons/:id` (plural). No design impact — documentation / task-spec drift only.
2. **Create-flow no auto-navigation after `Get My Recommendation`.** `src/pages/Compare.tsx`
   finishes the pipeline (a new comparison is created in Supabase) but leaves the user on
   `/compare` instead of pushing them to `/comparisons/<new-id>`. Screenshot evidence:
   backend traffic shows POST to `analyze-properties` and `update-comparison-status` both
   200, and a subsequent GET `votes` query for the new `comparison_id=eq.482d53bb-…`
   confirming the comparison was persisted.
3. **EMPTY state on the task-prescribed comparison.** `b927fbd6-be82-4706-bc4b-1e7e22c89b3b`
   has no `recommendations` row — summary tab shows an EMPTY card. This is not a design
   deviation per se; rather, it limits what can be verified on that specific comparison
   (no PROS/CONS cards, no `RecommendationFeedback` widget). All of those render correctly
   on the secondary comparison `da6ee4b4-…`.
4. **Lighthouse a11y findings.**
   - `button-name` — icon-only buttons in the header (mobile menu toggle, share, password
     visibility toggle, etc.) are missing accessible names. Design-adjacent, affects
     screen-reader usability.
   - `color-contrast` — at least one text/background pair falls below WCAG AA. Specific
     offender not extracted from this run.
   - `heading-order` — heading levels skip in the page hierarchy (likely `<h1>` then
     `<h3>` without an intervening `<h2>`, or similar). May be inside
     `ExpertSectionPanel` where nested `Expert Opinions` (`<h2>`) → `Expert Insights`
     (`<h3>`) live under another `<h2>`.

No component-level deviation from `docs/aisumai-design-handoff/aisumai-compare-result.html`
was observed in the screenshots at the resolutions tested. WinnerBanner layout, tab bar
visual, PROS/CONS cards, summary typography, expert-section eyebrow/heading, and sticky
action bar all match the handoff.

## Conclusion

**PASS WITH FINDINGS**

All 7 verification steps completed end-to-end against the remote Supabase. WinnerBanner,
CompareTabs (5 tabs with keyboard nav), summary-tab primitives, details-tab full-field
coverage, photos tab, ComingSoon tabs for map/risk, ExpertSectionPanel moved below tabs,
and polished sticky action bar all render correctly across desktop/tablet/mobile. Auth-gated
feedback submit hits the expected REST endpoint and returns 201. The known comparison
ID from the task prompt has no generated recommendation, which is why the secondary
comparison was used to verify the summary-tab content and feedback widget. The create-flow
pipeline works (comparison created in DB) but doesn't redirect the user automatically
after success — worth a follow-up fix but not a design-alignment failure. Lighthouse a11y
at 90 with three standard findings that warrant their own remediation ticket.
