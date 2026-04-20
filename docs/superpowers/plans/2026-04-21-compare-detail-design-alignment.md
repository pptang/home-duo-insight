# Compare Detail Design-Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `/comparison/:id` (`src/pages/ComparisonDetail.tsx`) with the editorial design handoff at `docs/aisumai-design-handoff/aisumai-compare-result.html` via vertical-slice refactor.

**Architecture:** Extract presentational primitives into `src/components/compare-result/`; the page retains sole data ownership and passes plain props down. 10 slices: Slice 0 (tokens + scaffold, serial) → Slices 1, 2, 3+4, 5, 6, 7, 8 (parallelizable via dispatched subagents) → Slice 9 (verification against remote Supabase via Chrome DevTools MCP).

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui. Frontend-only; no DB schema or edge-function changes. Verification uses `chrome-devtools-mcp` against live `https://qditnqwrjioypsuxwagg.supabase.co`.

**Spec:** `docs/superpowers/specs/2026-04-21-compare-detail-design-alignment-design.md`

---

## Dispatch Strategy

- **Phase 1 (serial):** One agent runs Task 0. Must complete before Phase 2.
- **Phase 2 (parallel):** Dispatch 6 agents concurrently for Tasks 1, 2, 3+4 (pair), 5, 6, 7, 8. Each agent rebases on latest `main` before committing; each commits independently.
- **Phase 3 (serial):** After all Phase 2 work lands on a single branch, one agent runs Task 9 (verification) and posts screenshots/findings to the PR thread.

Each task's "Commit" step uses Conventional Commits-style messages so the orchestrator can squash or reorder cleanly.

---

## File Structure

**New files (all in `src/components/compare-result/`):**

| File | Responsibility | Created in |
|---|---|---|
| `CompareSection.tsx` | Section wrapper (eyebrow label + heading + children) | Task 0 |
| `WinnerBanner.tsx` | 2-col A/B card with ink-inverted winner side | Task 1 |
| `CompareTabs.tsx` | 5-tab mono-label bar + active panel slot | Task 2 |
| `ComparisonTable.tsx` | 3-col data table (key / val-a / val-b) | Task 3 |
| `AIAnalysisBlock.tsx` | Ink-header + paper-body AI summary | Task 3 |
| `ProsConsGrid.tsx` | 2-col pros/cons grid with thumb icons | Task 3 |
| `ComingSoonTab.tsx` | Styled placeholder for Map + Risk tabs | Task 6 |
| `ExpertSectionPanel.tsx` | Wraps existing `ExpertSection` with below-tabs header | Task 7 |

**Modified files:**

- `tailwind.config.ts` — typography utilities, shadows, motion, risk colors (Task 0)
- `src/index.css` — typography classes, bar-fill keyframe (Task 0)
- `src/pages/ComparisonDetail.tsx` — replace inline sections with extracted primitives (Tasks 1–8)

---

### Task 0: Design tokens + compare-result scaffold (Phase 1, serial)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`
- Create: `src/components/compare-result/CompareSection.tsx`
- Create: `src/components/compare-result/index.ts`

- [ ] **Step 0.1: Add shadow, motion, and risk-color tokens to `tailwind.config.ts`**

Add to `theme.extend` object (inside `extend: { ... }`, alongside existing `colors`/`keyframes`). Keep existing entries; only add new keys.

```ts
// inside theme.extend:
boxShadow: {
  card: '0 1px 2px rgba(10,10,10,0.04), 0 1px 3px rgba(10,10,10,0.06)',
  widget: '0 4px 12px rgba(10,10,10,0.08)',
  drawer: '0 -4px 24px rgba(10,10,10,0.12)',
},
transitionDuration: {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
},
transitionTimingFunction: {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
},
```

Extend `colors` (inside the existing `colors: { ... }` block) with:

```ts
'risk-low': '#4a7c59',
'risk-med': '#c4942a',
'risk-high': '#b04040',
```

Extend `keyframes` with:

```ts
'bar-fill': {
  from: { width: '0%' },
  to: { width: 'var(--bar-target, 100%)' },
},
```

Extend `animation` with:

```ts
'bar-fill': 'bar-fill 800ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
```

- [ ] **Step 0.2: Add typography utility classes to `src/index.css`**

Append inside the existing `@layer utilities` block (around lines 98–145, after `.label-mono-sm`):

```css
/* ─── Editorial type scale ─────────────────────────── */
.text-hero {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 44px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.text-section {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.01em;
}
.text-property-name {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 20px;
  line-height: 1.2;
  letter-spacing: -0.015em;
}
.text-price {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.text-price-lg {
  font-family: 'DM Mono', monospace;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.text-label-xs {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.text-label-sm {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.text-label-md {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.text-mono-value {
  font-family: 'DM Mono', monospace;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 0.3: Create `src/components/compare-result/CompareSection.tsx`**

```tsx
import type { ReactNode } from 'react';

interface CompareSectionProps {
  eyebrow?: string;
  heading?: string;
  headingId?: string;
  children: ReactNode;
  className?: string;
}

export const CompareSection = ({
  eyebrow,
  heading,
  headingId,
  children,
  className = '',
}: CompareSectionProps) => (
  <section className={`max-w-[1040px] mx-auto px-6 ${className}`}>
    {(eyebrow || heading) && (
      <header className="mb-4">
        {eyebrow && (
          <div className="text-label-sm text-ink-60 mb-1">{eyebrow}</div>
        )}
        {heading && (
          <h2 id={headingId} className="text-section text-ink">
            {heading}
          </h2>
        )}
      </header>
    )}
    {children}
  </section>
);
```

- [ ] **Step 0.4: Create `src/components/compare-result/index.ts` barrel**

```ts
export { CompareSection } from './CompareSection';
```

- [ ] **Step 0.5: Verify build passes and new classes emit**

Run: `npm run build`
Expected: build succeeds. Tailwind JIT will only emit typography utilities once they're referenced in source; Step 0.2 defines them as CSS classes (not JIT utilities), so they're always present.

- [ ] **Step 0.6: Commit**

```bash
git add tailwind.config.ts src/index.css src/components/compare-result/CompareSection.tsx src/components/compare-result/index.ts
git commit -m "feat(compare-result): add design tokens + CompareSection scaffold

Adds shadow/motion/risk-color Tailwind tokens, typography scale
utilities in index.css, and the CompareSection wrapper primitive.
Foundation for the compare-result design-alignment slices."
```

---

### Task 1: Hero WinnerBanner (Phase 2, parallel)

**Files:**
- Create: `src/components/compare-result/WinnerBanner.tsx`
- Modify: `src/pages/ComparisonDetail.tsx` (replace ScoreSide usage with WinnerBanner)
- Modify: `src/components/compare-result/index.ts` (add export)

- [ ] **Step 1.1: Create `WinnerBanner.tsx`**

The component renders the `score-duel` layout (CSS already in `src/index.css` lines 172–192) with the winner's side ink-inverted. Scores are removed; a verdict tag replaces them.

```tsx
import { Crown } from 'lucide-react';

export interface WinnerBannerProperty {
  name: string;
  price: string; // already formatted, e.g. "¥5,980万"
}

interface WinnerBannerProps {
  propertyA: WinnerBannerProperty;
  propertyB: WinnerBannerProperty;
  winner: 'A' | 'B' | 'draw';
  verdictTag?: string; // short label shown on winner side, e.g. "AI 推奨"
}

export const WinnerBanner = ({
  propertyA,
  propertyB,
  winner,
  verdictTag = 'AI 推奨',
}: WinnerBannerProps) => (
  <div className="score-duel" role="group" aria-label="比較結果">
    <Side
      label="物件 A"
      property={propertyA}
      winner={winner === 'A'}
      draw={winner === 'draw'}
      verdictTag={verdictTag}
    />
    <Side
      label="物件 B"
      property={propertyB}
      winner={winner === 'B'}
      draw={winner === 'draw'}
      verdictTag={verdictTag}
    />
  </div>
);

interface SideProps {
  label: string;
  property: WinnerBannerProperty;
  winner: boolean;
  draw: boolean;
  verdictTag: string;
}

const Side = ({ label, property, winner, draw, verdictTag }: SideProps) => (
  <div
    className={`duel-side ${winner ? 'winner' : draw ? '' : 'loser'}`}
    aria-current={winner ? 'true' : undefined}
  >
    {winner && (
      <div className="absolute top-3 right-3 text-label-xs border border-paper/25 text-paper/80 px-2 py-1 rounded-sm flex items-center gap-1">
        <Crown className="w-3 h-3" aria-hidden="true" />
        {verdictTag}
      </div>
    )}
    <div
      className={`text-label-xs mb-2 ${winner ? 'opacity-60' : 'text-ink-60'}`}
    >
      {label}
    </div>
    <div className="text-property-name mb-3 line-clamp-2">{property.name}</div>
    <div
      className={`text-price-lg ${winner ? 'text-paper' : 'text-ink'}`}
    >
      {property.price}
    </div>
  </div>
);
```

- [ ] **Step 1.2: Export from barrel `src/components/compare-result/index.ts`**

```ts
export { CompareSection } from './CompareSection';
export { WinnerBanner } from './WinnerBanner';
export type { WinnerBannerProperty } from './WinnerBanner';
```

- [ ] **Step 1.3: Replace ScoreSide usage in `src/pages/ComparisonDetail.tsx`**

Delete the existing `ScoreSide` inline component (lines 353–386). Replace the "Score Duel" section (lines 254–274) with:

```tsx
{/* Hero banner */}
<section className="max-w-[1040px] mx-auto px-6 pt-8">
  <div className="text-label-sm text-ink-60 mb-3">AI の判定</div>
  <WinnerBanner
    propertyA={{
      name: comparison.property_a.property_name || '物件 A',
      price: formatPrice(comparison.property_a.price_yen),
    }}
    propertyB={{
      name: comparison.property_b.property_name || '物件 B',
      price: formatPrice(comparison.property_b.price_yen),
    }}
    winner={winner}
  />
</section>
```

Add the import at the top of `ComparisonDetail.tsx` (with the other `@/components` imports):

```tsx
import { WinnerBanner } from '@/components/compare-result';
```

Remove now-unused imports from line 4: drop `Crown` from the `lucide-react` import list (still used nowhere else in the file after ScoreSide removal).

Remove the faked `scoreA`/`scoreB` assignments (lines 210–211). Keep the `winner` computation (line 209); it becomes the only derived value.

- [ ] **Step 1.4: Verify build**

Run: `npm run build`
Expected: no TypeScript errors, no unused-import warnings.

- [ ] **Step 1.5: Commit**

```bash
git add src/components/compare-result/WinnerBanner.tsx src/components/compare-result/index.ts src/pages/ComparisonDetail.tsx
git commit -m "feat(compare-result): replace ScoreSide with WinnerBanner

Removes the faked numeric scores. Hero now shows 2-col A/B card with
ink inversion on the winner side and verdict tag; verdict logic stays
the price heuristic for now. Matches aisumai-compare-result.html hero."
```

---

### Task 2: Tab bar shell + expert-tab removal (Phase 2, parallel)

**Files:**
- Create: `src/components/compare-result/CompareTabs.tsx`
- Modify: `src/pages/ComparisonDetail.tsx` (replace inline tabs, remove `expert` tab)
- Modify: `src/components/compare-result/index.ts`

- [ ] **Step 2.1: Create `CompareTabs.tsx`**

```tsx
import type { ReactNode } from 'react';
import { useRef } from 'react';

export interface CompareTab<Id extends string> {
  id: Id;
  label: string;
  disabled?: boolean;
}

interface CompareTabsProps<Id extends string> {
  tabs: ReadonlyArray<CompareTab<Id>>;
  activeTab: Id;
  onChange: (id: Id) => void;
  children: ReactNode; // the active tab's panel content
}

export function CompareTabs<Id extends string>({
  tabs,
  activeTab,
  onChange,
  children,
}: CompareTabsProps<Id>) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const enabled = tabs.filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.id === activeTab);
    if (idx === -1) return;
    const nextIdx =
      e.key === 'ArrowRight'
        ? (idx + 1) % enabled.length
        : (idx - 1 + enabled.length) % enabled.length;
    onChange(enabled[nextIdx].id);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[role="tab"]',
    );
    buttons?.[tabs.indexOf(enabled[nextIdx])]?.focus();
  };

  return (
    <>
      <div
        ref={listRef}
        role="tablist"
        aria-label="比較レポートのセクション"
        className="max-w-[1040px] mx-auto px-6 mt-10 border-b border-rule flex gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-disabled={tab.disabled || undefined}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={onKeyDown}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={`text-label-md px-4 py-3 border-b-2 whitespace-nowrap transition-colors duration-normal ${
                isActive
                  ? 'border-ink text-ink'
                  : tab.disabled
                  ? 'border-transparent text-ink-30 cursor-not-allowed'
                  : 'border-transparent text-ink-60 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <section
        role="tabpanel"
        className="max-w-[1040px] mx-auto px-6 mt-8"
      >
        {children}
      </section>
    </>
  );
}
```

- [ ] **Step 2.2: Export from barrel**

Append to `src/components/compare-result/index.ts`:

```ts
export { CompareTabs } from './CompareTabs';
export type { CompareTab } from './CompareTabs';
```

- [ ] **Step 2.3: Replace inline tab bar in `ComparisonDetail.tsx`**

Change the `Tab` type (line 46) from:

```tsx
type Tab = "summary" | "details" | "photos" | "expert";
```

to:

```tsx
type Tab = "summary" | "details" | "photos" | "map" | "risk";
```

Change `useState<Tab>("summary")` — no change needed, still `"summary"`.

Replace the tabs nav + tab content sections (lines 277–325) with:

```tsx
<CompareTabs
  tabs={[
    { id: 'summary', label: '概要比較' },
    { id: 'details', label: '詳細データ' },
    { id: 'photos', label: '写真' },
    { id: 'map', label: '地図・交通' },
    { id: 'risk', label: 'リスク分析' },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
>
  {activeTab === 'summary' && (
    <SummaryTab
      comparison={comparison}
      recommendation={recommendation}
      formatPrice={formatPrice}
    />
  )}
  {activeTab === 'details' && (
    <DetailsTab comparison={comparison} formatPrice={formatPrice} />
  )}
  {activeTab === 'photos' && (
    <PhotosTab
      comparison={comparison}
      handleRetryImageExtraction={handleRetryImageExtraction}
    />
  )}
  {activeTab === 'map' && <MapTabPlaceholder />}
  {activeTab === 'risk' && <RiskTabPlaceholder />}

  {recommendation && activeTab === 'summary' && (
    <div className="mt-8">
      <RecommendationFeedback recommendationId={recommendation.id} />
    </div>
  )}
</CompareTabs>
```

Add the import at the top:

```tsx
import { WinnerBanner, CompareTabs } from '@/components/compare-result';
```

(If Task 1 has not merged yet, omit `WinnerBanner` here; the merge step reconciles.)

Add two stub components below the exported default (they'll be replaced in Task 6, but must exist now so this task compiles):

```tsx
const MapTabPlaceholder = () => (
  <div className="border border-dashed border-rule rounded-lg p-12 text-center bg-paper-dark/40">
    <div className="text-label-sm text-ink-30 mb-2">地図・交通</div>
    <div className="text-[13px] text-ink-60">準備中</div>
  </div>
);
const RiskTabPlaceholder = () => (
  <div className="border border-dashed border-rule rounded-lg p-12 text-center bg-paper-dark/40">
    <div className="text-label-sm text-ink-30 mb-2">リスク分析</div>
    <div className="text-[13px] text-ink-60">準備中</div>
  </div>
);
```

Remove the now-dead `ExpertSection` import from the top of the file — expert content is no longer a tab. Task 7 will add `ExpertSectionPanel` below the tabs.

- [ ] **Step 2.4: Verify build + keyboard nav**

Run: `npm run build`
Expected: passes.

Run: `npm run dev` and manually verify in browser — tab key focuses the active tab button; ←/→ move between tabs and update the panel.

- [ ] **Step 2.5: Commit**

```bash
git add src/components/compare-result/CompareTabs.tsx src/components/compare-result/index.ts src/pages/ComparisonDetail.tsx
git commit -m "feat(compare-result): extract CompareTabs, add 5-tab design structure

Replaces inline tab bar with accessible CompareTabs primitive
(role=tablist, ←/→ nav). Drops the 専門家コメント tab (expert
content moves below tabs in a later task) and adds placeholder panels
for 地図・交通 and リスク分析."
```

---

### Task 3: Summary tab primitives (Phase 2, paired with Task 4)

**Files:**
- Create: `src/components/compare-result/ComparisonTable.tsx`
- Create: `src/components/compare-result/AIAnalysisBlock.tsx`
- Create: `src/components/compare-result/ProsConsGrid.tsx`
- Modify: `src/pages/ComparisonDetail.tsx` (replace inline `SummaryTab`, `ProsCons`)
- Modify: `src/components/compare-result/index.ts`

- [ ] **Step 3.1: Create `ComparisonTable.tsx`**

```tsx
export interface ComparisonRow {
  key: string;
  label: string;
  valueA: string | null | undefined;
  valueB: string | null | undefined;
  mono?: boolean; // render values in DM Mono (e.g. prices, areas)
  highlight?: 'A' | 'B'; // subtle bg to signal which side "wins" this row
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  headerA?: string;
  headerB?: string;
}

const renderValue = (v: string | null | undefined) =>
  v === null || v === undefined || v === '' ? (
    <span className="text-ink-30">—</span>
  ) : (
    v
  );

// Grid template kept as a literal class so Tailwind JIT can resolve it.
const GRID_COLS = 'grid grid-cols-[140px_1fr_1fr]';

export const ComparisonTable = ({
  rows,
  headerA,
  headerB,
}: ComparisonTableProps) => {
  const showHeader = Boolean(headerA || headerB);
  return (
    <div
      role="table"
      className="border border-rule rounded-lg overflow-hidden bg-white"
    >
      {showHeader && (
        <div
          role="row"
          className={`${GRID_COLS} bg-paper-dark border-b border-rule`}
        >
          <div className="px-4 py-2.5 text-label-xs text-ink-60" role="columnheader">
            項目
          </div>
          <div
            className="px-4 py-2.5 text-label-xs text-ink-60 border-l border-rule"
            role="columnheader"
          >
            {headerA}
          </div>
          <div
            className="px-4 py-2.5 text-label-xs text-ink-60 border-l border-rule"
            role="columnheader"
          >
            {headerB}
          </div>
        </div>
      )}
      {rows.map((row, i) => {
        const zebra = i % 2 === 1 ? 'bg-paper' : '';
        const valueClass = row.mono
          ? 'text-mono-value text-[13px]'
          : 'text-[13px] font-medium';
        return (
          <div
            role="row"
            key={row.key}
            className={`${GRID_COLS} border-b border-rule last:border-b-0 ${zebra}`}
          >
            <div
              role="rowheader"
              className="px-4 py-3 text-ink-60 text-label-sm"
            >
              {row.label}
            </div>
            <div
              role="cell"
              className={`px-4 py-3 border-l border-rule ${valueClass} ${
                row.highlight === 'A' ? 'bg-ink/[0.03]' : ''
              }`}
            >
              {renderValue(row.valueA)}
            </div>
            <div
              role="cell"
              className={`px-4 py-3 border-l border-rule ${valueClass} ${
                row.highlight === 'B' ? 'bg-ink/[0.03]' : ''
              }`}
            >
              {renderValue(row.valueB)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

Note: the `grid-cols-[140px_1fr_1fr]` arbitrary value must appear literally in source so Tailwind JIT can resolve it. That's why the template is held in the `GRID_COLS` module constant instead of being constructed from a prop.

- [ ] **Step 3.2: Create `AIAnalysisBlock.tsx`**

```tsx
import type { ReactNode } from 'react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export type AIPointKind = 'pro-a' | 'pro-b' | 'caution';

export interface AIPoint {
  kind: AIPointKind;
  text: string;
}

interface AIAnalysisBlockProps {
  eyebrow?: string; // e.g. "AI サマリー"
  heading?: string;
  /** Markdown body; rendered with prose-invert because bg is ink */
  body: string;
  points?: AIPoint[];
  footer?: ReactNode;
}

const kindToStyle: Record<AIPointKind, string> = {
  'pro-a': 'border-paper/25 text-paper',
  'pro-b': 'border-paper/25 text-paper',
  caution: 'border-risk-med/60 text-risk-med',
};

const kindToLabel: Record<AIPointKind, string> = {
  'pro-a': 'A の強み',
  'pro-b': 'B の強み',
  caution: '留意点',
};

export const AIAnalysisBlock = ({
  eyebrow = 'AI サマリー',
  heading,
  body,
  points,
  footer,
}: AIAnalysisBlockProps) => (
  <div className="bg-ink text-paper rounded-lg p-6 sm:p-8 shadow-widget">
    <div className="text-label-xs opacity-60 mb-3">{eyebrow}</div>
    {heading && (
      <h3 className="text-section text-paper mb-4">{heading}</h3>
    )}
    <div className="text-[14px] leading-[1.7] prose prose-invert max-w-none">
      <MarkdownRenderer content={body} />
    </div>
    {points && points.length > 0 && (
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {points.map((p, i) => (
          <li
            key={i}
            className={`text-label-xs border rounded-sm px-3 py-2 ${kindToStyle[p.kind]}`}
          >
            <span className="opacity-70 mr-2">{kindToLabel[p.kind]}</span>
            <span className="text-[12px] normal-case tracking-normal">
              {p.text}
            </span>
          </li>
        ))}
      </ul>
    )}
    {footer && <div className="mt-5 text-label-xs opacity-50">{footer}</div>}
  </div>
);
```

- [ ] **Step 3.3: Create `ProsConsGrid.tsx`**

```tsx
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ProsConsSide {
  title: string;
  pros: string[];
  cons: string[];
}

interface ProsConsGridProps {
  a: ProsConsSide;
  b: ProsConsSide;
}

export const ProsConsGrid = ({ a, b }: ProsConsGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
    <Side data={a} />
    <Side data={b} />
  </div>
);

const Side = ({ data }: { data: ProsConsSide }) => (
  <div className="bg-white p-6">
    <h3 className="text-property-name mb-4 pb-3 border-b border-rule">
      {data.title}
    </h3>
    <List
      icon={<ThumbsUp className="w-3 h-3" aria-hidden="true" />}
      label="Pros"
      items={data.pros}
    />
    <div className="mt-5">
      <List
        icon={<ThumbsDown className="w-3 h-3" aria-hidden="true" />}
        label="Cons"
        items={data.cons}
      />
    </div>
  </div>
);

const List = ({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) => (
  <>
    <div className="flex items-center gap-1.5 text-label-xs text-ink-60 mb-2">
      {icon}
      {label}
    </div>
    <ul className="space-y-1.5 text-[13px]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-ink-30" aria-hidden="true">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </>
);
```

- [ ] **Step 3.4: Export from barrel**

Append to `src/components/compare-result/index.ts`:

```ts
export { ComparisonTable } from './ComparisonTable';
export type { ComparisonRow } from './ComparisonTable';
export { AIAnalysisBlock } from './AIAnalysisBlock';
export type { AIPoint, AIPointKind } from './AIAnalysisBlock';
export { ProsConsGrid } from './ProsConsGrid';
```

- [ ] **Step 3.5: Rewrite `SummaryTab` in `ComparisonDetail.tsx`**

Delete the inline `ProsCons` component (lines 482–516) entirely.

Replace the `SummaryTab` component (lines 388–480) with:

```tsx
const SummaryTab = ({
  comparison,
  recommendation,
}: {
  comparison: ComparisonData;
  recommendation: AIRecommendation | null;
}) => {
  if (!recommendation) {
    return (
      <div className="border border-dashed border-rule rounded-lg p-12 text-center bg-paper-dark/40">
        <div className="text-label-sm text-ink-30 mb-2">Empty</div>
        <h3 className="text-property-name mb-2">
          AI レポートはまだ生成されていません
        </h3>
        <p className="text-[13px] text-ink-60 mb-5">
          物件 URL から再生成して、AI による比較分析を取得してください。
        </p>
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 text-[13px] no-underline rounded-md hover:opacity-85"
        >
          再生成する →
        </Link>
      </div>
    );
  }

  const summaryRows: ComparisonRow[] = (recommendation.summary_table || []).map(
    (row, i) => ({
      key: `summary-${i}`,
      label: row.field,
      valueA: row.property_a,
      valueB: row.property_b,
    }),
  );

  return (
    <div className="space-y-8">
      <AIAnalysisBlock body={recommendation.final_recommendation} />
      {summaryRows.length > 0 && (
        <div>
          <div className="text-label-sm text-ink-60 mb-3">主要項目</div>
          <ComparisonTable
            rows={summaryRows}
            headerA={`A · ${comparison.property_a.property_name || '物件 A'}`}
            headerB={`B · ${comparison.property_b.property_name || '物件 B'}`}
          />
        </div>
      )}
      <ProsConsGrid
        a={{
          title: comparison.property_a.property_name || '物件 A',
          pros: recommendation.property_a_pros,
          cons: recommendation.property_a_cons,
        }}
        b={{
          title: comparison.property_b.property_name || '物件 B',
          pros: recommendation.property_b_pros,
          cons: recommendation.property_b_cons,
        }}
      />
    </div>
  );
};
```

Add the imports at the top of `ComparisonDetail.tsx`:

```tsx
import {
  WinnerBanner,
  CompareTabs,
  ComparisonTable,
  AIAnalysisBlock,
  ProsConsGrid,
} from '@/components/compare-result';
import type { ComparisonRow } from '@/components/compare-result';
```

(If earlier tasks have not merged, include only what Task 3 needs — `ComparisonTable`, `AIAnalysisBlock`, `ProsConsGrid`, `ComparisonRow`.)

Update the `<SummaryTab …>` JSX call site inside `CompareTabs` to drop the now-unused `formatPrice` prop:

```tsx
{activeTab === 'summary' && (
  <SummaryTab comparison={comparison} recommendation={recommendation} />
)}
```

- [ ] **Step 3.6: Verify build**

Run: `npm run build`
Expected: passes; `MarkdownRenderer` still resolves; no unused imports.

- [ ] **Step 3.7: Commit**

```bash
git add src/components/compare-result/ComparisonTable.tsx src/components/compare-result/AIAnalysisBlock.tsx src/components/compare-result/ProsConsGrid.tsx src/components/compare-result/index.ts src/pages/ComparisonDetail.tsx
git commit -m "feat(compare-result): extract summary-tab primitives

Adds ComparisonTable, AIAnalysisBlock (with optional pro-a/pro-b/caution
points slot), and ProsConsGrid. Rewrites SummaryTab to compose them.
No data-shape change; AIPoint slot is opt-in for future prompt work."
```

---

### Task 4: Details tab full-field coverage (Phase 2, runs after Task 3 in same agent)

**Files:**
- Modify: `src/pages/ComparisonDetail.tsx` (expand `PropertyData` fetch, expand `DetailsTab`)

- [ ] **Step 4.1: Expand `PropertyData` interface**

Update the interface at the top of `ComparisonDetail.tsx`:

```tsx
interface PropertyData {
  id: string;
  property_name: string | null;
  address: string | null;
  price_yen: number | null;
  floor_plan: string | null;
  commute_minutes: number | null;
  property_type: string | null;
  image_urls: string[] | null;
  notes: string | null;
  private_area_sqm: number | null;
  construction_year: number | null;
  construction_month: number | null;
  building_age_years: number | null;
}
```

- [ ] **Step 4.2: Add new columns to both Supabase selects**

There are two `supabase.from("comparisons").select(...)` calls in the file (lines 62–66 inside `useComparisonSubscription`, and lines 101–108 inside the effect). Update both `property_a:properties!…(…)` and `property_b:properties!…(…)` column lists to include the four new columns. The new column list for each side:

```
id, property_name, address, price_yen, floor_plan, commute_minutes,
property_type, image_urls, notes, private_area_sqm,
construction_year, construction_month, building_age_years
```

Both selects must be updated identically. Preserve the `recommendations(...)` select in the effect as-is.

- [ ] **Step 4.3: Rewrite `DetailsTab` with full field set**

Replace the existing `DetailsTab` (lines 518–592) with:

```tsx
const DetailsTab = ({
  comparison,
  formatPrice,
}: {
  comparison: ComparisonData;
  formatPrice: (p: number | null) => string;
}) => {
  const a = comparison.property_a;
  const b = comparison.property_b;

  const buildingAge = (p: PropertyData): string | null => {
    if (p.building_age_years != null) {
      const y = Math.floor(p.building_age_years);
      return y === 0 ? '新築' : `築${y}年`;
    }
    if (p.construction_year) {
      const month = p.construction_month ? `${p.construction_month}月` : '';
      return `${p.construction_year}年${month}竣工`;
    }
    return null;
  };

  const area = (p: PropertyData): string | null =>
    p.private_area_sqm != null ? `${p.private_area_sqm} ㎡` : null;

  const commute = (p: PropertyData): string | null =>
    p.commute_minutes != null ? `徒歩 ${p.commute_minutes} 分` : null;

  const rows: ComparisonRow[] = [
    { key: 'price', label: '価格', valueA: formatPrice(a.price_yen), valueB: formatPrice(b.price_yen), mono: true },
    { key: 'address', label: '住所', valueA: a.address, valueB: b.address },
    { key: 'floor', label: '間取り', valueA: a.floor_plan, valueB: b.floor_plan, mono: true },
    { key: 'area', label: '専有面積', valueA: area(a), valueB: area(b), mono: true },
    { key: 'age', label: '築年', valueA: buildingAge(a), valueB: buildingAge(b) },
    { key: 'commute', label: '通勤時間', valueA: commute(a), valueB: commute(b), mono: true },
    { key: 'type', label: '種別', valueA: a.property_type, valueB: b.property_type },
    { key: 'notes', label: 'メモ', valueA: a.notes, valueB: b.notes },
  ];

  return (
    <ComparisonTable
      rows={rows}
      headerA={`A · ${a.property_name || '物件 A'}`}
      headerB={`B · ${b.property_name || '物件 B'}`}
    />
  );
};
```

- [ ] **Step 4.4: Verify build**

Run: `npm run build`
Expected: passes. New column names must match the actual Supabase schema (verified from `20250908034500_add_property_enhancement_fields.sql`).

- [ ] **Step 4.5: Commit**

```bash
git add src/pages/ComparisonDetail.tsx
git commit -m "feat(compare-detail): details tab covers full property schema

Adds private_area_sqm, construction_year/month, and building_age_years
to PropertyData + the Supabase selects. DetailsTab now renders
price/address/floor/area/age/commute/type/notes via ComparisonTable."
```

---

### Task 5: Photos tab alignment (Phase 2, parallel)

**Files:**
- Modify: `src/pages/ComparisonDetail.tsx` (tighten `PhotosTab` to use design tokens)

This slice is minimal — `PropertyImageDisplay` already handles the photo grid; only the wrapper styling needs to match the design's aspect-varied 2-col layout.

- [ ] **Step 5.1: Rewrite `PhotosTab`**

Replace the existing `PhotosTab` (lines 594–621) with:

```tsx
const PhotosTab = ({
  comparison,
  handleRetryImageExtraction,
}: {
  comparison: ComparisonData;
  handleRetryImageExtraction: (id: string) => Promise<void>;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
    {[comparison.property_a, comparison.property_b].map((p, i) => (
      <div key={p.id} className="bg-white p-5">
        <div className="text-label-xs text-ink-60 mb-2">
          {i === 0 ? '物件 A' : '物件 B'}
        </div>
        <h3 className="text-property-name mb-4 truncate">
          {p.property_name || `物件 ${i === 0 ? 'A' : 'B'}`}
        </h3>
        <PropertyImageDisplay
          imageUrls={p.image_urls}
          propertyName={p.property_name || `物件 ${i === 0 ? 'A' : 'B'}`}
          imageExtractionStatus={comparison.image_extraction_status}
          aspectRatio="video"
          comparisonId={comparison.id}
          onRetryImageExtraction={handleRetryImageExtraction}
        />
      </div>
    ))}
  </div>
);
```

The only changes from the current implementation are class name swaps (`font-mono text-[9px] uppercase tracking-[0.12em]` → `text-label-xs`; `font-display text-[18px] tracking-[-0.2px]` → `text-property-name`). Functionality unchanged.

- [ ] **Step 5.2: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 5.3: Commit**

```bash
git add src/pages/ComparisonDetail.tsx
git commit -m "refactor(compare-detail): photos tab uses semantic type tokens

Swaps raw Tailwind typography classes for the new editorial
utilities (text-label-xs, text-property-name). No behavior change."
```

---

### Task 6: Map + Risk placeholder tabs (Phase 2, parallel)

**Files:**
- Create: `src/components/compare-result/ComingSoonTab.tsx`
- Modify: `src/pages/ComparisonDetail.tsx` (replace stub placeholders from Task 2)
- Modify: `src/components/compare-result/index.ts`

- [ ] **Step 6.1: Create `ComingSoonTab.tsx`**

```tsx
import type { ReactNode } from 'react';

interface ComingSoonTabProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

export const ComingSoonTab = ({
  eyebrow,
  title,
  description,
  icon,
}: ComingSoonTabProps) => (
  <div className="border border-dashed border-rule rounded-lg bg-paper-dark/40 p-12 text-center">
    {icon && (
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-rule text-ink-60 mb-4" aria-hidden="true">
        {icon}
      </div>
    )}
    <div className="text-label-sm text-ink-30 mb-2">{eyebrow}</div>
    <h3 className="text-section text-ink mb-3">{title}</h3>
    <p className="text-[13px] text-ink-60 max-w-[520px] mx-auto leading-[1.7]">
      {description}
    </p>
    <div className="mt-5 inline-block text-label-xs text-ink-60 border border-rule rounded-sm px-3 py-1.5">
      準備中 · Coming soon
    </div>
  </div>
);
```

- [ ] **Step 6.2: Export from barrel**

Append to `src/components/compare-result/index.ts`:

```ts
export { ComingSoonTab } from './ComingSoonTab';
```

- [ ] **Step 6.3: Replace stubs in `ComparisonDetail.tsx`**

Task 2 introduced `MapTabPlaceholder` and `RiskTabPlaceholder` as inline stubs. Delete them and replace with:

```tsx
const MapTabPlaceholder = () => (
  <ComingSoonTab
    eyebrow="地図・交通"
    title="交通アクセスと周辺情報"
    description="最寄り駅・路線数・所要時間、および主要施設までの経路を可視化したマップを準備しています。公開情報と現地調査を組み合わせ、物件ごとのアクセス性を比較できるようにします。"
    icon={<MapPin className="w-4 h-4" />}
  />
);
const RiskTabPlaceholder = () => (
  <ComingSoonTab
    eyebrow="リスク分析"
    title="ハザードと将来リスクの可視化"
    description="洪水・液状化・土砂災害などのハザードマップ情報と、エリアの資産価値トレンドに基づく将来リスクを AI が整理し、2 物件を並べて比較できるようにします。"
    icon={<ShieldAlert className="w-4 h-4" />}
  />
);
```

Add icons to the `lucide-react` import at the top of the file: `MapPin`, `ShieldAlert`.

Add `ComingSoonTab` to the `@/components/compare-result` imports.

- [ ] **Step 6.4: Verify build + visual**

Run: `npm run build`
Expected: passes.

Run: `npm run dev` and click the 地図・交通 and リスク分析 tabs in the browser; confirm `ComingSoonTab` renders with icon, heading, description, and "準備中" pill.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/compare-result/ComingSoonTab.tsx src/components/compare-result/index.ts src/pages/ComparisonDetail.tsx
git commit -m "feat(compare-result): add ComingSoonTab for map + risk

Replaces the Task 2 inline stubs with the reusable ComingSoonTab
primitive. Both new tabs now carry design-aligned eyebrow, title,
description, and 'Coming soon' pill. No data dependencies."
```

---

### Task 7: Expert section below tabs (Phase 2, parallel)

**Files:**
- Create: `src/components/compare-result/ExpertSectionPanel.tsx`
- Modify: `src/pages/ComparisonDetail.tsx` (add panel after `CompareTabs`)
- Modify: `src/components/compare-result/index.ts`

- [ ] **Step 7.1: Create `ExpertSectionPanel.tsx`**

```tsx
import { ExpertSection } from '@/components/ExpertSection';

interface ExpertSectionPanelProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
}

export const ExpertSectionPanel = ({
  comparisonId,
  propertyAName,
  propertyBName,
}: ExpertSectionPanelProps) => (
  <section className="max-w-[1040px] mx-auto px-6 mt-16 pt-12 border-t border-rule">
    <header className="mb-6">
      <div className="text-label-sm text-ink-60 mb-1">Expert Insight</div>
      <h2 className="text-section text-ink">不動産専門家の知見</h2>
      <p className="mt-2 text-[13px] text-ink-60 max-w-[620px]">
        AI 分析に加えて、地域を知る不動産専門家が現場の視点でコメントを追加できます。専門家のコメントが公開されると、閲覧者から直接問い合わせが届く場合があります。
      </p>
    </header>
    <ExpertSection
      comparisonId={comparisonId}
      propertyAName={propertyAName}
      propertyBName={propertyBName}
    />
  </section>
);
```

- [ ] **Step 7.2: Export from barrel**

Append to `src/components/compare-result/index.ts`:

```ts
export { ExpertSectionPanel } from './ExpertSectionPanel';
```

- [ ] **Step 7.3: Mount `ExpertSectionPanel` in `ComparisonDetail.tsx`**

Directly after the closing `</CompareTabs>` tag (i.e. after the tab panel section, before the sticky action bar), insert:

```tsx
<ExpertSectionPanel
  comparisonId={comparison.id}
  propertyAName={comparison.property_a.property_name || '物件 A'}
  propertyBName={comparison.property_b.property_name || '物件 B'}
/>
```

Add the import:

```tsx
import { ExpertSectionPanel } from '@/components/compare-result';
```

Ensure the `ExpertSection` top-level import (line 10) has been removed — the panel wraps it now. If still present, delete the line.

- [ ] **Step 7.4: Verify**

Run: `npm run build`
Expected: passes.

Run: `npm run dev`, visit `/comparison/b927fbd6-be82-4706-bc4b-1e7e22c89b3b`, and confirm:
- The expert section appears below the tab panel regardless of which tab is active.
- Switching tabs does not unmount the expert section (it stays in view).

- [ ] **Step 7.5: Commit**

```bash
git add src/components/compare-result/ExpertSectionPanel.tsx src/components/compare-result/index.ts src/pages/ComparisonDetail.tsx
git commit -m "feat(compare-detail): move expert section below tabs

Wraps ExpertSection with ExpertSectionPanel (design's Expert Insight
header + intro copy) and mounts it below CompareTabs. Expert content
is now always visible regardless of active tab, matching the
aisumai-compare-result.html layout."
```

---

### Task 8: Sticky action bar polish (Phase 2, parallel)

**Files:**
- Modify: `src/pages/ComparisonDetail.tsx` (sticky bar uses `shadow-drawer` + design tokens)

- [ ] **Step 8.1: Update sticky action bar**

Replace the sticky action bar block (lines 328–348, the `<div className="fixed bottom-0 left-0 right-0 …">` region) with:

```tsx
<div className="fixed bottom-0 left-0 right-0 bg-ink text-paper border-t border-ink/40 shadow-drawer z-30">
  <div className="max-w-[1040px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
    <span className="text-label-sm opacity-50 hidden sm:block">
      このレポートが役に立ちましたか？
    </span>
    <div className="flex items-center gap-2 ml-auto">
      <Link
        to="/compare"
        className="text-label-md text-paper border border-paper/25 rounded-md px-3 py-2 no-underline hover:bg-paper/10 transition-colors duration-fast"
      >
        別の比較を作成
      </Link>
      <Link
        to="/auth"
        className="text-label-md text-ink bg-paper rounded-md px-3 py-2 no-underline hover:opacity-85 transition-opacity duration-fast"
      >
        専門家に相談する →
      </Link>
    </div>
  </div>
</div>
```

Changes: added `shadow-drawer`, swapped raw `font-mono text-[10/11px] uppercase tracking-*` for the new `.text-label-*` utilities, added motion-token-driven hover transitions.

- [ ] **Step 8.2: Verify build + short-viewport render**

Run: `npm run build`
Expected: passes.

Run: `npm run dev`; resize browser to 600px height; confirm the bar pins to the bottom, buttons stay readable, and the shadow renders above page content (not below it).

- [ ] **Step 8.3: Commit**

```bash
git add src/pages/ComparisonDetail.tsx
git commit -m "style(compare-detail): sticky bar uses shadow-drawer + type tokens

Upgrades the sticky CTA bar to use shadow-drawer and the new
.text-label-* utilities. Button hover animations respect the
motion token (duration-fast)."
```

---

### Task 9: Verification (Phase 3, serial, single agent)

**Files:**
- No code changes. This task produces screenshots and a verification report.

This task runs against **remote Supabase** using the live app on `http://localhost:8080`. The verifier must have the credentials pasted out-of-band (not in this plan).

- [ ] **Step 9.1: Set up environment**

Create `.env.local` in the repo root (gitignored; do **not** commit):

```
VITE_SUPABASE_URL=https://qditnqwrjioypsuxwagg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from conversation context>
```

Run: `npm run dev`
Expected: Vite reports `Local: http://localhost:8080/`.

- [ ] **Step 9.2: Initial load + console/network clean**

Use `mcp__plugin_chrome-devtools-mcp_chrome-devtools__new_page` to open `http://localhost:8080/comparison/b927fbd6-be82-4706-bc4b-1e7e22c89b3b`.

Run `list_console_messages` and `list_network_requests`. Fail the task if:
- Any `error`-level console message appears.
- Any network request returns 4xx or 5xx.

Run `lighthouse_audit` with category `accessibility`. Fail the task if score < 90.

- [ ] **Step 9.3: Per-viewport screenshots for each tab**

For each viewport size: `1440×900`, `768×1024`, `375×812` (use `resize_page`):

For each tab id in `[overview, details, photos, map, risk]`:
- Click the corresponding tab via `click` on the button with role `tab` and the matching label.
- `take_screenshot` and label `compare-detail-<viewport>-<tab>.png`.

Attach all 15 screenshots to the verification report.

- [ ] **Step 9.4: Interaction round-trip**

- Use keyboard `press_key` with `ArrowRight` / `ArrowLeft` on the active tab; confirm focus and selection move.
- Hover the sticky bar CTAs (`hover` on both buttons); confirm visible hover state.
- Click `別の比較を作成` → should navigate to `/compare`; navigate back.

- [ ] **Step 9.5: Auth-gated flow**

Navigate to `/auth`. Fill in `koromiko1104@gmail.com` / `123456` and submit (`fill_form` + `click` on submit). Confirm redirect to a logged-in state.

Return to `/comparison/b927fbd6-be82-4706-bc4b-1e7e22c89b3b`. Scroll to the `RecommendationFeedback` component (at the bottom of the Summary tab). Click thumbs-up. Inspect `list_network_requests` and confirm a `POST` or `PATCH` request to `/rest/v1/recommendation_feedback` (or equivalent) returned 2xx.

- [ ] **Step 9.6: Create-flow smoke test**

Navigate to `/compare`. Paste the two SUUMO URLs into the widget:
- `https://suumo.jp/ms/shinchiku/shizuoka/sc_hamamatsushichuo/nc_67729550/`
- `https://suumo.jp/ms/shinchiku/shizuoka/sc_fujieda/nc_67732422/`

Submit. Wait for redirect to `/comparison/<new-id>`. Take a screenshot of the new report in its initial state; confirm the new `WinnerBanner`, 5-tab bar, and `ExpertSectionPanel` all render.

- [ ] **Step 9.7: Reduced motion**

Use `emulate` to set `prefers-reduced-motion: reduce`. Reload the page. Confirm that:
- `animate-in` entrance animations do not play.
- Hover transitions on sticky-bar buttons are near-instant.

Take one screenshot for the record.

- [ ] **Step 9.8: Write verification report**

Create `docs/superpowers/plans/2026-04-21-compare-detail-verification.md` with:
- All screenshots linked.
- Console/network/lighthouse results table (pass/fail per step).
- Any design-deviation findings (screenshot + description + design reference line).
- Conclusion: `PASS` / `PASS WITH FINDINGS` / `FAIL`.

- [ ] **Step 9.9: Commit verification report**

```bash
git add docs/superpowers/plans/2026-04-21-compare-detail-verification.md
git commit -m "docs(compare-detail): verification report for design alignment

Screenshots + interaction + a11y audit against remote Supabase using
comparison b927fbd6-be82-4706-bc4b-1e7e22c89b3b."
```

---

## Exit Criteria

- Tasks 0–8 committed; `npm run build` passes on integrated branch.
- Task 9 verification report committed with conclusion `PASS` or `PASS WITH FINDINGS` (findings raised as follow-up issues, not blockers).
- PR opened against `main` with link to design doc + verification report.
