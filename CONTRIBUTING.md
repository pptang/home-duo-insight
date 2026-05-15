# Contributing to AiSumai

## No emoji in JSX/TSX

AiSumai does **not** allow raw unicode emoji in source files (`*.ts` / `*.tsx`).
AI builders (Lovable, Bolt, etc.) frequently inject decorative emoji into UI
copy; we use [Lucide React](https://lucide.dev/) icons for all iconography
instead, so emoji in the tree are almost always unintended.

This is enforced by a custom ESLint rule, `local/no-emoji-jsx`
(`eslint-rules/no-emoji-jsx.js`), which scans:

- `JSXText` nodes (text between JSX tags)
- string `Literal` nodes
- template-literal text (`TemplateElement`)

It does **not** scan comments — a developer note mentioning an emoji is fine.

### How enforcement works

| Surface | Command | Severity | Effect |
| --- | --- | --- | --- |
| `npm run lint` (local + CI) | `eslint .` | `warn` | Reports emoji; does not fail the build |
| Pre-commit hook | `npx lint-staged` → `eslint --config eslint.emoji.config.js --max-warnings=0` | `error` | **Blocks the commit** if any *staged* `.ts`/`.tsx` file contains emoji |
| CI emoji guard | `npm run lint:emoji` (`EMOJI_LINT=error eslint .`) | `error` | Whole-tree emoji check; `continue-on-error` until the cleanup list below is empty |

Why the split severity: the repository carries pre-existing emoji (see the
cleanup list) and unrelated lint debt. Making the rule a hard `error` in the
shared `eslint.config.js` would turn `npm run lint` and `npm run build` red on
day one. Instead:

- The shared config keeps the rule at `warn` so builds stay green.
- The pre-commit hook uses a dedicated, emoji-only config
  (`eslint.emoji.config.js`) with `--max-warnings=0`, so it fails **only** on
  emoji in the files you actually touch — never on unrelated pre-existing
  warnings.
- CI runs `npm run lint:emoji` as a non-blocking guard; flip its
  `continue-on-error` to `false` (in `.github/workflows/lint.yml`) once the
  cleanup list is empty.

No per-file `eslint-disable` directives are permitted for this rule.

### Replacing an emoji

Use a [Lucide React](https://lucide.dev/icons/) icon. If a shared wrapper
exists under `src/components/ui/icons`, prefer that; otherwise import directly:

```tsx
// Before
<span>🏠 物件A</span>

// After
import { House } from "lucide-react";
<span><House className="h-4 w-4" aria-hidden /> 物件A</span>
```

Common mappings: `🏠`/`🏡` → `House`, `📍` → `MapPin`, `👁` → `Eye`,
`🔖` → `Bookmark`, `⚠️` → `AlertTriangle`, `✅`/`✓` → `Check`/`CheckCircle`,
`★` → `Star`, `🏆` → `Trophy`, `💡` → `Lightbulb`, `📈` → `TrendingUp`,
`🧠` → `Brain`, `🧭` → `Compass`, `⚖️` → `Scale`, `💰` → `Wallet`,
`✨` → `Sparkles`, `📝` → `FileText`, `🙏` → `HeartHandshake`,
`🌏` → `Globe`, `🤔` → `HelpCircle`. For flags (`🇯🇵` / `🇺🇸`) use a small SVG
or a country-code label rather than an icon.

### Allowed exceptions

There is currently **no blanket allow-list** — every emoji should be migrated
to a Lucide icon. If a genuine exception is ever required (e.g. user-generated
content stored verbatim), document the file and rationale in this section
first; per-file disable directives remain forbidden.

### Cleanup list (pre-existing offenders)

These files predate the rule and still contain emoji. They surface as
`warn` in `npm run lint` and should be migrated to Lucide icons. Until then,
`npm run lint:emoji` is non-blocking in CI.

- `src/components/RecommendationFeedback.tsx` — 🙏
- `src/components/MetadataReviewStage.tsx` — 🏠 🏡
- `src/components/LanguageSwitcher.tsx` — 🇺🇸 🇯🇵
- `src/components/ui/EditableField.tsx` — ✓
- `src/components/ui/MarkdownRenderer.tsx` — emoji-shortcode substitution map
  (⚖️ 📍 🌏 🧭 ✅ ⚠️ 📝 🏠 💰 ✨ 💡 📈 🤔 🧠); this one is a functional lookup
  table — migrate by mapping shortcodes to Lucide icon components.
- `src/components/admin/ExpertList.tsx` — ★
- `src/components/admin/ExpertProfileDetail.tsx` — ★
- `src/components/compare-result/AIAnalysisBlock.tsx` — ⚠ (caution glyph map)
- `src/components/compare-result/ExpertSectionPanel.tsx` — 🏠 👁 🔖 📍 ✓
- `src/pages/Index.tsx` — 👁 🔖
- `src/pages/ExpertProfilePage.tsx` — ✓
- `supabase/functions/generate-recommendation/index.ts` — emoji in a string
  literal (edge function; not user-facing JSX but still flagged by the rule)

Once this list is empty, set `continue-on-error: false` on the emoji guard
step in `.github/workflows/lint.yml`.
