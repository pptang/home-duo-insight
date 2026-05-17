# Mobile RWD Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four remaining mobile-responsiveness gaps from the home-duo-insight-oty gap audit.

**Architecture:** Three mechanical Tailwind/CSS class fixes (body font, hamburger touch target, input zoom) plus one component extraction — pull the Feed filter UI into a reusable `FeedFilters` component rendered by both the desktop sidebar and a new mobile slide-in `Sheet` drawer.

**Tech Stack:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui (`Sheet` component already present).

**Note on testing:** This project has no unit-test runner (no `test` script in `package.json`). Verification for every task is `npm run build` + `npm run lint` plus the manual viewport check described in Task 4.

---

### Task 1: Body base font 15px on mobile (Gap 4)

**Files:**
- Modify: `src/index.css:95-101`

- [ ] **Step 1: Add a mobile media query for body font-size**

In `src/index.css`, the `body` rule inside the `@layer base` block at lines 95-101 currently is:

```css
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
}
```

Leave the `body` rule unchanged (14px stays the desktop default). Immediately after the closing `}` of the `@layer base` block at line 102, add:

```css

/* ─── Mobile base font bump (home-duo-insight-oty) ──────────
   iOS/Android readability: lift body copy to 15px below the
   768px breakpoint. Editorial type-scale utilities below use
   explicit px sizes and are unaffected. */
@media (max-width: 767px) {
  body {
    font-size: 15px;
  }
}
```

- [ ] **Step 2: Verify build and lint pass**

Run: `npm run build && npm run lint`
Expected: build succeeds, lint reports no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "fix(oty): bump mobile body font to 15px"
```

---

### Task 2: Hamburger touch target 44px (Gap 3)

**Files:**
- Modify: `src/components/ui/Topbar.tsx:66-71`

- [ ] **Step 1: Enlarge the mobile menu button**

In `src/components/ui/Topbar.tsx`, the mobile menu toggle button currently has `className="md:hidden p-1.5 text-ink rounded hover:bg-ink/[0.06]"` (line 67). Replace that className with:

```
md:hidden min-h-[44px] min-w-[44px] -mr-1 flex items-center justify-center text-ink rounded hover:bg-ink/[0.06]
```

Leave everything else on the button (the `onClick`, `aria-label="Toggle menu"`, and the `h-5 w-5` icon) unchanged.

- [ ] **Step 2: Verify build and lint pass**

Run: `npm run build && npm run lint`
Expected: build succeeds, lint reports no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Topbar.tsx
git commit -m "fix(oty): enlarge hamburger touch target to 44px"
```

---

### Task 3: iOS input zoom — textarea and select (Gap 2)

**Files:**
- Modify: `src/components/ui/textarea.tsx:13`
- Modify: `src/components/ui/select.tsx:20`

Background: iOS Safari zooms the viewport when a focused control has font-size <16px. `input.tsx` is already correct (`text-base md:text-sm`); only `textarea` and the `select` trigger need the fix.

- [ ] **Step 1: Fix the textarea font size**

In `src/components/ui/textarea.tsx`, the class string at line 13 contains `text-sm`. Change that single token `text-sm` to `text-base md:text-sm`. The rest of the class string is unchanged. Resulting line 13:

```
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
```

- [ ] **Step 2: Fix the select trigger font size**

In `src/components/ui/select.tsx`, the `SelectTrigger` class string at line 20 contains `text-sm`. Change that single token `text-sm` to `text-base md:text-sm`. The rest of the class string is unchanged. Resulting line 20:

```
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
```

Do NOT change `text-sm` on `SelectLabel` (line 106) or `SelectItem` (line 119) — those are not focusable controls.

- [ ] **Step 3: Verify build and lint pass**

Run: `npm run build && npm run lint`
Expected: build succeeds, lint reports no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/textarea.tsx src/components/ui/select.tsx
git commit -m "fix(oty): raise textarea/select font to 16px on mobile to stop iOS zoom"
```

---

### Task 4: Feed filters mobile drawer (Gap 1)

**Files:**
- Create: `src/components/FeedFilters.tsx`
- Modify: `src/pages/Feed.tsx`

Background: `src/pages/Feed.tsx` renders the filter sidebar as `hidden md:block`, so mobile users cannot filter. We extract the filter UI into `FeedFilters` and render it in both the desktop `<aside>` and a new mobile `Sheet` drawer.

Currently `Feed.tsx` defines, near the bottom of the file, `FilterGroup` (line ~350) and `FilterOption` (line ~359), and near the top the constants `STATUS_FILTERS`, `AREA_FILTERS`, `PRICE_FILTERS` (lines ~37-55). Inside the `Feed` component there is a `toggleSet` helper (line ~163). All of these are used ONLY by the filter sidebar. They move into `FeedFilters.tsx`.

- [ ] **Step 1: Create the `FeedFilters` component**

Create `src/components/FeedFilters.tsx` with this exact content:

```tsx
import { Link } from "react-router-dom";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS = [
  { id: "all", label: "すべて" },
  { id: "expert", label: "専門家コメント済み" },
  { id: "pending", label: "コメント待ち" },
];

const AREA_FILTERS = [
  { id: "tokyo", label: "東京" },
  { id: "osaka", label: "大阪" },
  { id: "nagoya", label: "名古屋" },
  { id: "yokohama", label: "横浜" },
];

const PRICE_FILTERS = [
  { id: "p1", label: "〜3,000万" },
  { id: "p2", label: "3,000〜6,000万" },
  { id: "p3", label: "6,000〜1億" },
  { id: "p4", label: "1億〜" },
];

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-60 pb-2 mb-2 border-b border-rule">
      {title}
    </div>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
);

const FilterOption = ({
  label,
  active,
  onClick,
  radio = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  radio?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 text-left px-2 py-1.5 rounded text-[12px] transition-colors ${
      active ? "bg-ink text-paper" : "text-ink-60 hover:text-ink hover:bg-ink/[0.04]"
    }`}
  >
    <span
      className={`w-3.5 h-3.5 ${radio ? "rounded-full" : "rounded-sm"} border ${
        active ? "border-paper bg-paper" : "border-rule bg-transparent"
      } flex items-center justify-center`}
    >
      {active && (
        <span className={`block ${radio ? "w-1.5 h-1.5 rounded-full bg-ink" : "w-2 h-2 bg-ink"}`} />
      )}
    </span>
    {label}
  </button>
);

export interface FeedFiltersProps {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  activeAreas: Set<string>;
  setActiveAreas: (s: Set<string>) => void;
  activePrices: Set<string>;
  setActivePrices: (s: Set<string>) => void;
}

const FeedFilters = ({
  statusFilter,
  setStatusFilter,
  activeAreas,
  setActiveAreas,
  activePrices,
  setActivePrices,
}: FeedFiltersProps) => {
  const toggleSet = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <>
      <FilterGroup title="ステータス">
        {STATUS_FILTERS.map((s) => (
          <FilterOption
            key={s.id}
            label={s.label}
            active={statusFilter === s.id}
            onClick={() => setStatusFilter(s.id)}
            radio
          />
        ))}
      </FilterGroup>

      <FilterGroup title="エリア">
        {AREA_FILTERS.map((a) => (
          <FilterOption
            key={a.id}
            label={a.label}
            active={activeAreas.has(a.id)}
            onClick={() => toggleSet(activeAreas, a.id, setActiveAreas)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="価格帯">
        {PRICE_FILTERS.map((p) => (
          <FilterOption
            key={p.id}
            label={p.label}
            active={activePrices.has(p.id)}
            onClick={() => toggleSet(activePrices, p.id, setActivePrices)}
          />
        ))}
      </FilterGroup>

      <SurfaceCard tone="paper-dark" pad="sm" className="mt-8">
        <Eyebrow size="sm" className="mb-2">
          専門家の方へ
        </Eyebrow>
        <div className="font-display text-[16px] tracking-[-0.2px] mb-2 leading-[1.2]">
          レポートを認領
        </div>
        <p className="text-[12px] text-ink-60 leading-relaxed mb-3">
          あなたの専門知識でユーザーをサポート。
        </p>
        <Button asChild variant="editorial" size="editorial-sm">
          <Link to="/auth">専門家として登録</Link>
        </Button>
      </SurfaceCard>
    </>
  );
};

export default FeedFilters;
```

- [ ] **Step 2: Remove the migrated code from `Feed.tsx`**

In `src/pages/Feed.tsx`:

1. Delete the `STATUS_FILTERS`, `AREA_FILTERS`, and `PRICE_FILTERS` const declarations (the three arrays near lines 37-55).
2. Delete the `FilterGroup` component definition (≈ lines 350-357).
3. Delete the `FilterOption` component definition (≈ lines 359-388).
4. Delete the `toggleSet` helper inside the `Feed` component (≈ lines 163-168):

```tsx
  const toggleSet = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };
```

The `statusFilter`/`activeAreas`/`activePrices` state declarations (lines ~63-65) STAY in `Feed.tsx`.

- [ ] **Step 3: Update imports in `Feed.tsx`**

At the top of `src/pages/Feed.tsx`:

1. Add `SlidersHorizontal` to the existing `lucide-react` import. The current line is:
   `import { Plus, AlertTriangle } from "lucide-react";`
   Change to:
   `import { Plus, AlertTriangle, SlidersHorizontal } from "lucide-react";`

2. Add these two new import lines after the existing `@/components` imports:

```tsx
import FeedFilters from "@/components/FeedFilters";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
```

- [ ] **Step 4: Render `FeedFilters` in the desktop sidebar**

In `src/pages/Feed.tsx`, replace the entire body of the desktop `<aside>` (the `<FilterGroup>`/`SurfaceCard` markup, ≈ lines 175-224) so the `<aside>` reads:

```tsx
        <aside className="hidden md:block border-r border-rule p-6 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto">
          <FeedFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            activeAreas={activeAreas}
            setActiveAreas={setActiveAreas}
            activePrices={activePrices}
            setActivePrices={setActivePrices}
          />
        </aside>
```

- [ ] **Step 5: Add the mobile filter drawer to the Feed header**

In `src/pages/Feed.tsx`, the Feed header has a `<div className="flex items-center gap-2">` containing the sort `<select>` and the 新規比較 `Button`. Add the mobile-only filter drawer as the FIRST child of that `div`, before the `<select>`:

```tsx
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="絞り込み"
                    className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 border border-rule rounded-md"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    絞り込み
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>絞り込み</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FeedFilters
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      activeAreas={activeAreas}
                      setActiveAreas={setActiveAreas}
                      activePrices={activePrices}
                      setActivePrices={setActivePrices}
                    />
                  </div>
                </SheetContent>
              </Sheet>
```

- [ ] **Step 6: Verify build and lint pass**

Run: `npm run build && npm run lint`
Expected: build succeeds with no TypeScript errors (in particular, no "unused variable" or "cannot find name" errors for the removed `FilterGroup`/`FilterOption`/`toggleSet`/constants). Lint reports no new errors.

- [ ] **Step 7: Manual viewport verification**

Run `npm run dev` and, using browser devtools device emulation, check at widths 375, 390, 360, and 768 px:
- Feed page: the 絞り込み button is visible below 768px and hidden at/above it.
- Tapping 絞り込み opens the left drawer; the three filter groups and the 専門家の方へ card render.
- Selecting a status/area/price filter inside the drawer updates the feed list (filter state is shared with desktop).
- At ≥768px the desktop sidebar still renders and the 絞り込み button is hidden.
- Tap a `<textarea>` (e.g. on `/compare` or an expert form) and a `<Select>` trigger at 375px width — the viewport does not zoom.
- The hamburger button in the top bar is comfortably tappable.
- Body copy reads at 15px on mobile.

- [ ] **Step 8: Commit**

```bash
git add src/components/FeedFilters.tsx src/pages/Feed.tsx
git commit -m "feat(oty): make Feed filters reachable on mobile via slide-in drawer"
```

---

## Self-Review

- **Spec coverage:** Gap 1 → Task 4; Gap 2 → Task 3; Gap 3 → Task 2; Gap 4 → Task 1. All four spec gaps covered.
- **Out-of-scope items** (editorial micro-labels, already-done layout work) correctly excluded.
- **Type consistency:** `FeedFiltersProps` defined in Task 4 Step 1 is used verbatim in Steps 4 and 5. Setter signatures `(s: Set<string>) => void` match the `useState<Set<string>>` setters in `Feed.tsx`.
- **No placeholders:** every code step shows complete code.
