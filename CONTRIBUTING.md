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
| CI emoji guard | `npm run lint:emoji` (`EMOJI_LINT=error eslint .`) | `error` | Whole-tree emoji check; **hard-blocks CI** — the build fails on any Unicode emoji in source |

Why the split severity: keeping the rule at `warn` in the shared
`eslint.config.js` avoids turning `npm run lint` and `npm run build` red on
unrelated lint debt, while a dedicated emoji-only check still hard-blocks
introductions. Concretely:

- The shared config keeps the rule at `warn` so builds stay green.
- The pre-commit hook uses a dedicated, emoji-only config
  (`eslint.emoji.config.js`) with `--max-warnings=0`, so it fails **only** on
  emoji in the files you actually touch — never on unrelated pre-existing
  warnings.
- CI runs `npm run lint:emoji` as a **blocking** guard
  (`continue-on-error: false` in `.github/workflows/lint.yml`): any Unicode
  emoji introduced anywhere in the tree fails the build.

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

_Empty._ All pre-existing offenders have been migrated to Lucide React icons,
and the CI emoji guard is now a hard block (`continue-on-error: false`). Any new
Unicode emoji in source will fail the build — migrate it to a Lucide icon
instead of adding it back here.
