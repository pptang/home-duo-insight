import type { ComponentType } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkEmoji from 'remark-emoji';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Text } from 'mdast';
import {
  Scale,
  MapPin,
  Globe,
  Compass,
  CheckCircle,
  AlertTriangle,
  FileText,
  House,
  Wallet,
  Sparkles,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  Brain,
  type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom shortcodes that `remark-emoji` does not resolve. Each maps to a
// Lucide React icon component so no Unicode emoji literals live in source.
const CUSTOM_ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  ':scales:': Scale,
  ':round_pushpin:': MapPin,
  ':earth_asia:': Globe,
  ':compass:': Compass,
  ':white_check_mark:': CheckCircle,
  ':warning:': AlertTriangle,
  ':memo:': FileText,
  ':house:': House,
  ':moneybag:': Wallet,
  ':sparkles:': Sparkles,
  ':bulb:': Lightbulb,
  ':chart_with_upwards_trend:': TrendingUp,
  ':thinking:': HelpCircle,
  ':brain:': Brain,
};

const SHORTCODE_RE = new RegExp(
  `(${Object.keys(CUSTOM_ICON_MAP)
    .map((code) => code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})`,
  'g',
);

// mdast node carrying instructions for `mdast-util-to-hast` to emit a custom
// `<icon name="...">` element, which the `components` map renders below.
interface IconNode {
  type: 'icon';
  value: string;
  data: { hName: 'icon'; hProperties: { name: string } };
}

/**
 * Remark plugin: split text nodes on the custom shortcodes and replace each
 * match with an icon node. Must run *before* `remarkEmoji` so it claims its
 * shortcodes before they are resolved to Unicode emoji. Surrounding text is
 * preserved exactly.
 */
function remarkCustomIcons() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      const value = node.value;
      if (!value.includes(':')) return;
      const parts = value.split(SHORTCODE_RE);
      if (parts.length === 1) return;

      const replacement = parts
        .filter((part) => part !== '')
        .map((part): Text | IconNode => {
          if (part in CUSTOM_ICON_MAP) {
            return {
              type: 'icon',
              value: part,
              data: { hName: 'icon', hProperties: { name: part } },
            };
          }
          return { type: 'text', value: part };
        });

      // IconNode is not a standard mdast child; the cast is required because
      // it is a synthetic node consumed only by mdast-util-to-hast via hName.
      parent.children.splice(
        index,
        1,
        ...(replacement as unknown as typeof parent.children),
      );
      return index + replacement.length;
    });
  };
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /**
   * When true, renders for dark backgrounds: inherits the parent text color
   * instead of forcing `text-foreground`, and applies `prose-invert`.
   */
  invert?: boolean;
}

// `icon` is a non-standard intrinsic element produced by remarkCustomIcons;
// react-markdown's Components type only knows HTML tags, hence the extension.
type IconComponentProps = { name?: string };
type ExtendedComponents = Components & {
  icon: ComponentType<IconComponentProps>;
};

const components: ExtendedComponents = {
  icon: ({ name }: IconComponentProps) => {
    const Icon = name ? CUSTOM_ICON_MAP[name] : undefined;
    if (!Icon) return null;
    return (
      <Icon className="inline-block h-[1.1em] w-[1.1em] align-text-bottom" aria-hidden />
    );
  },
};

export function MarkdownRenderer({ content, className, invert = false }: MarkdownRendererProps) {
  return (
    <div className={cn(
      "prose prose-gray max-w-none",
      invert && "prose-invert",
      invert
        ? "prose-headings:text-current prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3"
        : "prose-headings:text-primary prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3",
      invert
        ? "prose-h2:text-lg prose-h2:border-b prose-h2:border-current/20 prose-h2:pb-2"
        : "prose-h2:text-lg prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
      invert
        ? "prose-p:text-current prose-p:leading-relaxed prose-p:my-3"
        : "prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3",
      invert
        ? "prose-ul:my-3 prose-ul:pl-5 prose-li:my-1 prose-li:text-current prose-li:marker:text-current"
        : "prose-ul:my-3 prose-ul:pl-5 prose-li:my-1 prose-li:text-foreground",
      invert
        ? "prose-strong:text-current prose-strong:font-semibold"
        : "prose-strong:text-foreground prose-strong:font-semibold",
      invert
        ? "prose-hr:border-current/20 prose-hr:my-6"
        : "prose-hr:border-border prose-hr:my-6",
      "prose-table:border-collapse prose-table:w-full",
      invert
        ? "prose-th:border prose-th:border-current/20 prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-current"
        : "prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left",
      invert
        ? "prose-td:border prose-td:border-current/20 prose-td:px-3 prose-td:py-2 prose-td:text-current"
        : "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
      "[&>*:first-child]:mt-0",
      className
    )}>
      <ReactMarkdown
        // remarkCustomIcons MUST run before remarkEmoji: it claims the
        // shortcodes in CUSTOM_ICON_MAP and turns them into <icon> elements;
        // remarkEmoji then resolves any remaining standard shortcodes.
        remarkPlugins={[remarkGfm, remarkCustomIcons, remarkEmoji, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
