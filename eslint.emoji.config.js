/**
 * Emoji-only ESLint config — used by the lint-staged pre-commit hook.
 *
 * Why a separate config:
 * The main `eslint.config.js` carries the project's full rule set, which
 * includes pre-existing `react-refresh` warnings and `@typescript-eslint`
 * errors across the tree. Running the pre-commit hook with the full config
 * + `--max-warnings=0` would block commits to ANY file that happens to
 * carry an unrelated pre-existing warning (e.g. every shadcn/ui component).
 *
 * This config enables ONLY `local/no-emoji-jsx` at `error`. The pre-commit
 * hook (`npx lint-staged`) runs `eslint --config eslint.emoji.config.js
 * --max-warnings=0` against staged `*.{ts,tsx}` files, so a commit is
 * blocked if and only if a staged file contains an emoji in JSX text or a
 * string literal — never for unrelated lint debt.
 *
 * CI (`npm run lint:emoji`) runs the same emoji rule across the whole tree
 * via the main config with `EMOJI_LINT=error`.
 */
import tseslint from "typescript-eslint";
import localRules from "./eslint-rules/no-emoji-jsx.js";

export default tseslint.config({
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    // The TS parser is required so `.tsx` files parse; without it ESLint's
    // default parser chokes on type syntax. JSX support is enabled too.
    parser: tseslint.parser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
  plugins: {
    local: localRules,
  },
  rules: {
    "local/no-emoji-jsx": "error",
  },
});
