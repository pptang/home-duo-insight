import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import localRules from "./eslint-rules/no-emoji-jsx.js";

export default tseslint.config(
  { ignores: ["dist", "eslint-rules", ".agents", ".codex", ".claude"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      local: localRules,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Emoji rule: WARN by default so `npm run lint` / `npm run build` stay
      // green on the pre-existing emoji in the tree (see CONTRIBUTING.md
      // cleanup list). The pre-commit hook runs `eslint --max-warnings=0`,
      // which escalates this warning to a hard block on any file you touch —
      // so new/changed code cannot introduce emoji. Set EMOJI_LINT=error
      // (see `npm run lint:emoji`) to fail outright — used by the CI emoji
      // guard step.
      "local/no-emoji-jsx": process.env.EMOJI_LINT === "error" ? "error" : "warn",
    },
  },
  {
    // shadcn/ui vendored primitives + Tailwind config: relax rules that
    // conflict with upstream-generated code we don't hand-author.
    files: ["src/components/ui/**/*.{ts,tsx}", "tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
