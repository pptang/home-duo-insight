# Clarify Landing compare chip multi-select logic

**Bead:** home-duo-insight-98a
**Date:** 2026-05-17
**Ref:** docs/aisumai-claude-code-prompt-pack.html Task 14

## Problem

The Landing page compare widget has 6 filter chips (価格 / 交通 / 築年数 / 間取り /
学区 / リスク). Current behavior is biased and incomplete:

- `activeChips` defaults to `new Set(["price"])` — 価格 is pre-selected, biasing
  every comparison toward price.
- Selected chips **never reach the AI**: `handleCompare` calls
  `generateRecommendation` with hardcoded `defaultLandingPreferences` only.
- No helper text explains what the selection does.
- No persistence — selections are lost on navigation.

## Goal

Make the chips an honest, neutral multi-select that genuinely influences the AI
comparison:

- All chips inactive by default.
- 0 selected → AI weighs all dimensions equally.
- N selected → AI weights the selected dimensions higher (still mentioning the
  rest).
- Helper text reflects the current selection.
- Selection persists within the browser session.

## Design

### 1. Frontend — `src/pages/Index.tsx`

- `activeChips` defaults to an **empty** `Set`. A lazy `useState` initializer
  reads `sessionStorage` key `aisumai:compare-chips` (a JSON array of chip ids),
  tolerating parse errors by falling back to empty.
- A `useEffect` on `activeChips` writes the current ids back to `sessionStorage`.
  Selections survive in-session navigation and reset when the tab closes.
- A **helper text** line is rendered under the chip row:
  - 0 selected → `全ての観点で比較します`
  - N selected → `「<labels joined by ・>」を重視して比較します`
    (e.g. `「価格・交通」を重視して比較します`)
- `handleCompare` passes `Array.from(activeChips)` to `generateRecommendation`.

### 2. `src/lib/comparisonFlow.ts`

- `generateRecommendation` gains a `comparisonFocus: string[] = []` parameter,
  sent in the edge-function request body as `comparison_focus`.
- Raw chip ids (`price` / `access` / `age` / `layout` / `school` / `risk`) are
  sent. The edge function owns the id → human-description mapping so the prompt
  text stays server-side and bilingual.

### 3. Edge function — `supabase/functions/generate-recommendation/index.ts`

- `RequestData` gains `comparison_focus?: string[]`.
- A `buildFocusText()` helper maps chip ids to bilingual dimension descriptions
  and produces a prompt block:
  - empty / absent → instruct the model to weigh **all** dimensions equally and
    fairly.
  - non-empty → instruct the model to **weight the selected dimensions higher**
    while still addressing the others.
- `getPromptByLanguage` gains a `focusText` parameter, injected as a new block
  immediately after the user-profile section.
- Unknown ids are ignored defensively.
- The updated function is **deployed** to Supabase.

### 4. Out of scope

- No DB persistence of `comparison_focus` (not written to the `recommendations`
  row).
- No automated tests — the project has no test infrastructure.
- No changes to other entry points (Personalization wizard, etc.).

## Verification

- `npm run build` and lint pass clean.
- Edge function deploys successfully.
- Optional browser smoke test: chips inactive on load, helper text toggles
  correctly, selection persists across in-session navigation.
