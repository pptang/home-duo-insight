# Mobile RWD Audit Fixes — Design

**Bead:** home-duo-insight-oty (P1)
**Date:** 2026-05-17
**Status:** Approved

## Background

User feedback: "mobile version is also bad". The 2026-05-16 gap audit marked the
mobile RWD work PARTIAL — hamburger menu, overlay, broad breakpoints, and column
stacking are done. Four gaps remain. This spec covers only those four. No new
architecture: all changes are CSS/Tailwind class adjustments plus one extracted
mobile component.

## Gap 1 — Feed filters inaccessible on mobile

`src/pages/Feed.tsx:174` renders the filter sidebar as `hidden md:block`, so
mobile users cannot filter the feed at all.

**Fix:** slide-in drawer.

- Extract the filter content (the three `FilterGroup` blocks + the
  "専門家の方へ" `SurfaceCard`) into a `FeedFilters` component so the desktop
  `<aside>` and the mobile drawer render identical markup from one source.
- Keep the existing `hidden md:block` `<aside>` for desktop; it now renders
  `<FeedFilters />`.
- Add a mobile-only filters button ("絞り込み") in the Feed header, visible
  `md:hidden`.
- The button opens a shadcn `Sheet` (`side="left"`) whose body renders
  `<FeedFilters />`.
- Filter state (`statusFilter`, `activeAreas`, `activePrices` and their setters)
  stays in `Feed.tsx` and is passed to `FeedFilters` as props, so desktop and
  mobile share one set of state and one filtering code path.

## Gap 2 — iOS input zoom (font-size must be ≥16px on mobile)

iOS Safari zooms the viewport when a focused input has font-size <16px.

- `src/components/ui/input.tsx` — already `text-base md:text-sm`. No change.
- `src/components/ui/textarea.tsx` — `text-sm` → `text-base md:text-sm`.
- `src/components/ui/select.tsx` `SelectTrigger` — `text-sm` → `text-base md:text-sm`.

Only the trigger needs the 16px treatment (it is the focusable control);
`SelectLabel`/`SelectItem` keep `text-sm`.

**Addendum (found during browser smoke test):** the shadcn components above
are not the only inputs. The Landing hero compare widget, the Auth signup/login
form, and the ExpertProfilePage contact form use hand-rolled `<input>` /
`<textarea>` elements (not the shadcn component) with an explicit `text-[14px]`
class. Nine such controls exist across `src/pages/Index.tsx` (2),
`src/pages/Auth.tsx` (3), and `src/pages/ExpertProfilePage.tsx` (4). Each
`text-[14px]` becomes `text-[16px] md:text-[14px]`. This is the same iOS-zoom
fix and the original audit note ("inputs text-[14px] cause iOS zoom") was
pointing at exactly these.

## Gap 3 — Hamburger touch target below 44px

`src/components/ui/Topbar.tsx:67` — the mobile menu button is `p-1.5` with an
`h-5 w-5` icon, ≈32px total.

**Fix:** change the button classes to guarantee 44px regardless of icon size:
`min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1`
(replacing `p-1.5`). Icon stays `h-5 w-5`.

## Gap 4 — Body base font below 15px on mobile

`src/index.css:98` — `body { font-size: 14px }`.

**Fix:** keep 14px as the desktop default; add a mobile media query:

```css
@media (max-width: 767px) {
  body { font-size: 15px; }
}
```

Editorial type-scale utilities (`.text-hero`, `.text-section`, etc.) have
explicit pixel sizes and are unaffected. `15px` mobile only — desktop density
unchanged.

## Out of scope

- Restyling editorial micro-labels (`text-[10px]`/`text-[11px]` mono labels) —
  these are intentional design tokens, not form inputs.
- Any page-specific layout work already marked done in the gap audit
  (hamburger overlay, column stacking, breakpoints).

## Testing

- `npm run build` passes.
- `npm run lint` passes.
- Manual viewport check at 375 / 390 / 360 / 768 px:
  - Feed: filters reachable via the drawer; filtering works.
  - Tap a textarea / select on iOS-width viewport — no zoom.
  - Hamburger button is comfortably tappable.
  - Body copy reads at 15px on mobile.
