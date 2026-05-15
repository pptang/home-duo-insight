/**
 * Custom ESLint rule: no-emoji-jsx
 *
 * Flags unicode emoji characters in JSX text and string literals.
 *
 * Why: AI builders (Lovable / Bolt / etc.) frequently inject decorative
 * emoji into UI copy. AiSumai uses Lucide React icons (and
 * `src/components/ui/icons` when a wrapper exists) for all iconography, so
 * raw emoji in the source tree are almost always unintended.
 *
 * Scope: scans `JSXText` nodes and string `Literal` / `TemplateElement`
 * nodes. Comments are intentionally NOT scanned (a developer note about an
 * emoji is harmless and not user-facing).
 *
 * Replacement path: replace the emoji with a Lucide React icon, e.g.
 *   import { House } from "lucide-react";
 *   ...<House className="h-4 w-4" />
 *
 * Allowed exceptions: there is currently NO blanket allow-list. If a genuine
 * exception is needed, add the file/range to the documented exception list in
 * CONTRIBUTING.md and the maintainers' agreed override — per-file
 * `eslint-disable` directives are not permitted.
 */

// Unicode ranges that cover the vast majority of emoji / pictographs.
// Deliberately excludes:
//  - plain CJK / Latin text
//  - typographic arrows (U+2190-21FF, U+2B00-2BFF arrow block) which are
//    legitimate UI copy ("Next →"), not emoji
//  - the geometric-shape block (U+25A0-25FF: ◆ ◇ ★ ● etc.) used as plain
//    bullet / rating glyphs
// What it DOES catch: pictographic emoji (😀 🏠 🎉), regional-indicator flag
// pairs (🇯🇵), the dingbat block (✅ ✨ ⚠️ ✓ ✔), and the FE0F variation
// selector / ZWJ joiner used to compose emoji sequences.
const EMOJI_REGEX =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}]/u;

function findEmoji(text) {
  const match = EMOJI_REGEX.exec(text);
  return match ? match[0] : null;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow unicode emoji in JSX text and string literals; use Lucide React icons instead.",
      recommended: false,
    },
    schema: [],
    messages: {
      emojiFound:
        "Unicode emoji \"{{emoji}}\" is not allowed in source. Use a Lucide React icon (or src/components/ui/icons wrapper) instead. See CONTRIBUTING.md.",
    },
  },
  create(context) {
    function report(node, text) {
      const emoji = findEmoji(text);
      if (emoji) {
        context.report({ node, messageId: "emojiFound", data: { emoji } });
      }
    }

    return {
      JSXText(node) {
        report(node, node.value);
      },
      Literal(node) {
        if (typeof node.value === "string") {
          report(node, node.value);
        }
      },
      TemplateElement(node) {
        report(node, node.value.raw);
      },
    };
  },
};

export default {
  rules: {
    "no-emoji-jsx": rule,
  },
};
