# Compare Detail Page — Design-System Alignment

**Date:** 2026-04-21
**Target page:** `/comparison/:id` (`src/pages/ComparisonDetail.tsx`)
**Design source:** `docs/aisumai-design-handoff/aisumai-compare-result.html`, `aisumai-dev-handoff.html`, `aisumai-figma-tokens.json`, `aisumai-states.html`

## Problem

The "Refactor to editorial design system" merge (commits `850c45d`, `9e6f188`) adopted the new editorial design tokens across several pages but left `ComparisonDetail.tsx` structurally misaligned with the handoff. Specific gaps:

- Hero "Winner Banner" (scoreA vs scoreB duel) is absent; the current winner heuristic (`price-based`) is visible but does not match the design.
- Only 4 tabs render (概要 / 詳細 / 写真 / 専門家コメント) vs. 5 in the design (概要比較 / 詳細データ / 写真 / 地図・交通 / リスク分析).
- Expert content is inside a tab; design places it in a dedicated section below the tab panel.
- The design's primitives (WinnerBanner, ComparisonTable, AIAnalysisBlock, ProsConsGrid, ComingSoonTab) exist only as inline JSX, not as reusable components in `src/components/compare-result/`.
- Design tokens for typography scale, shadows (`card`/`widget`/`drawer`), motion (`duration-fast/normal/slow`, `ease-spring`), and risk colors are not yet in `tailwind.config.ts` / `src/index.css`.
- Details tab renders 5 property fields; the design calls for the full property dataset (area, age, station walk, management/repair fees, transaction type).
- No count-up / bar-fill / entrance animations per the handoff's motion specification; `prefers-reduced-motion` already respected elsewhere must be preserved.

## Scope

**In scope** (Category A — visual/structural alignment with existing data):

- Align `ComparisonDetail.tsx` structure, layout, and visual language to the handoff.
- Extract reusable compare-result primitives.
- Add missing design tokens.
- Expand Details tab to cover all available `PropertyData` fields.
- Move expert content out of tabs into a below-tabs section.
- Add placeholder content for the two new tabs (Map, Risk).
- Add entrance / hover animations where the tokens support them.

**Out of scope** (deferred follow-ups):

- Adding `scoreA` / `scoreB` / subScores to the `recommendations` schema or AI prompt.
- Real Map (transit) data or Risk (hazard) data — both tabs ship as `ComingSoonTab` placeholders.
- Similar-properties section below the sticky action bar.
- Backfilling category breakdowns (pro-a / pro-b / caution) from historical recommendations; new components accept these props, but existing data renders as undifferentiated bullets until the AI prompt is updated.

## Design Decisions (from brainstorming)

1. **WinnerBanner without numeric scores.** 2-col A/B card, winner side gets ink inversion + crown-style accent, loser side stays paper. Verdict tag pulled from `recommendations.final_recommendation`. No score numbers, no category bars. (Decision: option 1 of hero-handling.)
2. **Five tabs, placeholders for Map and Risk.** All 5 tabs clickable per design. 地図・交通 and リスク分析 render a `ComingSoonTab` with design's eyebrow label + disclaimer-style note. (Decision: option 3 of tab-handling.)
3. **Expert section moves below tabs.** The existing `専門家コメント` tab is removed; `ExpertSectionPanel` becomes a permanent below-tabs section. (Decision: align with design.)
4. **Tokens-less-than-full extraction, vertical slices.** Work progresses slice by slice (Approach C) dispatched across subagents where independent.

## Architecture

### Data ownership

`ComparisonDetail.tsx` remains the sole data-fetching layer. It:
- Loads `comparisons`, `properties` (both sides), and `recommendations` via existing React Query hooks.
- Computes UI-side derived state: `winner: 'A' | 'B' | 'draw'` (heuristic preserved: cheaper property wins), `verdict: string` (= `recommendations.final_recommendation`), `summaryRows` (from existing `summary_table` JSONB), `detailRows` (full set from `PropertyData`).
- Passes plain props down to primitives in `src/components/compare-result/`.

New compare-result components are **presentational only** — no Supabase, no React Query, no routing imports. This keeps them reusable and test-independent.

### Component tree (post-refactor)

```
ComparisonDetail
├── Header                         (existing)
├── Breadcrumb                     (existing inline; no new component)
├── CompareSection eyebrow="AI 比較レポート"
│   ├── Title grid (A vs B)        (inline, existing)
│   └── WinnerBanner               (NEW)
├── CompareTabs value tabs=[概要比較,詳細データ,写真,地図・交通,リスク分析]
│   ├── <Overview>   AIAnalysisBlock + ComparisonTable(summary) + ProsConsGrid
│   ├── <Details>    ComparisonTable(full)
│   ├── <Photos>     PropertyImageDisplay × 2
│   ├── <Map>        ComingSoonTab
│   └── <Risk>       ComingSoonTab
├── ExpertSectionPanel             (wraps existing ExpertSection, new header)
├── RecommendationFeedback         (existing)
├── Footer                         (existing)
└── Sticky action bar              (inline, existing)
```

### New files

```
src/components/compare-result/
├── CompareSection.tsx         # wrapper: eyebrow label + heading + children
├── WinnerBanner.tsx           # 2-col ink-inverted winner
├── CompareTabs.tsx            # 5-tab mono-label bar + panel slot
├── ComparisonTable.tsx        # 3-col data table (key / val-a / val-b)
├── AIAnalysisBlock.tsx        # ink-header + paper-body AI summary
├── ProsConsGrid.tsx           # 2-col pros/cons with thumb icons
├── ComingSoonTab.tsx          # placeholder panel for Map + Risk
└── ExpertSectionPanel.tsx     # below-tabs wrapper of existing ExpertSection
```

No other new files.

### Design tokens (added in Slice 0)

Added to `tailwind.config.ts` and/or `src/index.css`:

**Typography utilities** (backed by handoff tokens):
- `.text-hero` (DM Serif Display, 44/48, ls -0.02em)
- `.text-section` (DM Serif Display, 28/32)
- `.text-property-name` (DM Serif Display, 20/24)
- `.text-price`, `.text-price-lg` (DM Mono, tabular-nums)
- `.text-label-xs`, `.text-label-sm`, `.text-label-md` (DM Mono uppercase, ls 0.08–0.12em)
- `.text-mono-value` (DM Mono)

**Shadows** (Tailwind `shadow-card`, `shadow-widget`, `shadow-drawer`):
- `card`: `0 1px 2px rgba(28,28,28,0.04), 0 1px 3px rgba(28,28,28,0.06)`
- `widget`: `0 4px 12px rgba(28,28,28,0.08)`
- `drawer`: `0 -4px 24px rgba(28,28,28,0.12)`

**Motion** (Tailwind `duration-fast`, `duration-normal`, `duration-slow`; `ease-spring`):
- `fast` 150ms, `normal` 200ms, `slow` 300ms
- `spring` `cubic-bezier(0.34, 1.56, 0.64, 1)`

**Risk colors** (for `ComingSoonTab` risk variant + future use):
- `risk-low` `#4a7c59`, `risk-med` `#c4942a`, `risk-high` `#b04040`

**Keyframes** (in `src/index.css`):
- `bar-fill` (width 0 → target) — reserved for future score bars
- Existing `fade-in`, `slide-in` kept

All animations must no-op under `@media (prefers-reduced-motion: reduce)` (existing pattern in `src/index.css`).

## Vertical Slices (Approach C)

Each slice ships: its tokens (if any) + its component(s) + integration into `ComparisonDetail.tsx`. Agent dispatch shown in the writing-plans stage.

| # | Slice | New components | Depends on |
|---|---|---|---|
| 0 | Tokens + directory scaffold | `CompareSection` | — |
| 1 | Hero WinnerBanner | `WinnerBanner` | 0 |
| 2 | Tab bar shell + expert removal from tabs | `CompareTabs` | 0 |
| 3 | Summary tab (概要比較) | `ComparisonTable`, `AIAnalysisBlock`, `ProsConsGrid` | 0, 2 |
| 4 | Details tab (詳細データ), full field coverage | — (reuses `ComparisonTable`) | 3 |
| 5 | Photos tab alignment | — | 2 |
| 6 | Map + Risk placeholder tabs | `ComingSoonTab` | 2 |
| 7 | Expert section relocation (below tabs) | `ExpertSectionPanel` | 2 |
| 8 | Sticky action bar polish | — | 0 |
| 9 | Verification (Chrome DevTools MCP, remote Supabase) | — | all |

**Parallelization:** After slice 0 completes, slices 1, 2, 5, 6, 7, 8 run in parallel as independent subagents. Slices 3 → 4 are sequential (slice 4 reuses slice 3's `ComparisonTable`); dispatch them to one agent as a pair. Slice 9 runs after all parallel slices are merged.

## Data Flow

Only the `winner` and `verdict` derivations are new; everything else is already in `ComparisonDetail.tsx`:

```
props flow (top-down, no new fetches)

ComparisonDetail (data owner)
├─ winner = propertyA.price_jpy <= propertyB.price_jpy ? 'A' : 'B'   // existing heuristic, preserved
├─ verdict = recommendations.final_recommendation
├─ summaryRows = recommendations.summary_table as Row[]
├─ detailRows  = rowsFromPropertyData(propertyA, propertyB)          // NEW: expands to full field set
├─ aiParagraphs, aiPoints = markdown split of final_recommendation   // existing
│
├→ WinnerBanner            { propertyA, propertyB, winner, verdict }
├→ CompareTabs             { activeTab, onTabChange, tabs: [...] }
│   ├→ AIAnalysisBlock     { verdict, paragraphs, points? }
│   ├→ ComparisonTable     { rows: summaryRows | detailRows }
│   ├→ ProsConsGrid        { aPros, aCons, bPros, bCons }
│   └→ ComingSoonTab       { title, description }
└→ ExpertSectionPanel      { comparisonId }
```

`points?` on `AIAnalysisBlock` is typed as `Array<{ kind: 'pro-a' | 'pro-b' | 'caution'; text: string }>` — currently `undefined` because existing recommendations don't carry categorization; component renders paragraphs only when absent. Future AI prompt update can populate it without changing the component.

## Error & Empty States

No new error states introduced. Existing handling in `ComparisonDetail.tsx` (skeleton on load, error card on fetch failure, 404 on unknown id) is preserved. Individual primitives render defensively:

- `WinnerBanner` — if `verdict` is empty, hide verdict tag (banner still renders with winner inversion).
- `ComparisonTable` — empty-string / null values render as `—` in the value cell, not blank.
- `ComingSoonTab` — always a valid render; no dependence on data.
- `ExpertSectionPanel` — forwards to existing `ExpertSection`; unclaimed / claimed / published states handled there.

## Testing

### Environment (used by slice verifications + Slice 9)

1. `.env.local` (gitignored, session-only):
   ```
   VITE_SUPABASE_URL=https://qditnqwrjioypsuxwagg.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon key provided out-of-band>
   ```
2. `npm run dev` → `http://localhost:8080`, hits remote Supabase directly.
3. Chrome DevTools MCP navigates to `http://localhost:8080/comparison/b927fbd6-be82-4706-bc4b-1e7e22c89b3b`.
4. Sign in once as `koromiko1104@gmail.com`; reuse session across checks.

### Per-slice checks

Each slice agent must run these before declaring done:

| Slice | Check |
|---|---|
| 0 | `npm run build` passes; Tailwind JIT emits new utility classes; no visual diff yet |
| 1 | WinnerBanner: ink inversion on winning side; verdict tag populated; 1440/768/375 screenshots |
| 2 | 5 mono-label tabs render; active underline animates 200ms; ←/→ keyboard nav works |
| 3 | Summary tab: `AIAnalysisBlock` + `ComparisonTable` + `ProsConsGrid` in design order; markdown renders; verdict populated |
| 4 | Details tab: every available `PropertyData` field present; empty values render `—` |
| 5 | Photos tab: 2-col aspect-varied ≥768px; 1-col <480px |
| 6 | Map + Risk tabs clickable; `ComingSoonTab` renders; clean console |
| 7 | `ExpertSectionPanel` appears below tabs regardless of active tab; unclaimed / claimed / published states all render |
| 8 | Sticky bar pins to bottom with `shadow-drawer`; no overlap on short viewports |

### Slice 9 — full MCP verification pass

1. **Visual** — `take_screenshot` at 1440 / 768 / 375 for each of the 5 tabs; attach to the plan thread for design review.
2. **Console + network** — `list_console_messages` + `list_network_requests` on initial load; fail on any 4xx/5xx or uncaught error. Run `lighthouse_audit` and require Accessibility ≥ 90.
3. **Interaction** — click each tab, confirm animation, confirm tab state; hover sticky-bar buttons.
4. **Auth-gated** — sign in, submit RecommendationFeedback (thumbs up/down), verify network write in DevTools panel.
5. **Create flow smoke** — from `/` paste the two SUUMO URLs (`…nc_67729550/` and `…nc_67732422/`), run compare, arrive at a fresh comparison detail, confirm the new layout renders on a newly generated report.
6. **Keyboard** — Tab-navigate entire page; all interactive elements focusable with visible focus rings; no focus traps.
7. **Reduced motion** — `emulate` `prefers-reduced-motion: reduce`; reload; confirm entrance/fill animations skip to final state.

**Exit criteria:** all per-slice checks green + all Slice 9 items pass. Screenshots posted for each viewport/tab. Any remaining polish items raised as separate follow-up issues, not blocking merge.

## Risks

1. **Expert-account mutation during test** — the provided account (`koromiko1104@gmail.com`) may not have `expert` role; if so, slice 7's claimed/published states are verified against existing remote state on comparison `b927fbd6-…`, not by interactively claiming.
2. **Remote Supabase rate limits** — create-flow smoke test hits `analyze-properties` + `generate-recommendation` edge functions; if rate-limited during test, re-run at later time rather than retrying in a loop.
3. **Tailwind JIT class purging** — new typography utilities must be added to `content` globs or they'll be purged in production build; Slice 0 verifies via `npm run build`.
4. **Existing refactor drift** — if another PR touches `ComparisonDetail.tsx` during Phase 2 parallel execution, merge conflicts are likely. Mitigation: each slice agent rebases before committing; Slice 9 re-runs after all merges.
