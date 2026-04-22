import ReactMarkdown from 'react-markdown';
import remarkEmoji from 'remark-emoji';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// Map unsupported shortcodes to Unicode emojis
const CUSTOM_EMOJI_MAP: Record<string, string> = {
  ':scales:': '⚖️',
  ':round_pushpin:': '📍',
  ':earth_asia:': '🌏',
  ':compass:': '🧭',
  ':white_check_mark:': '✅',
  ':warning:': '⚠️',
  ':memo:': '📝',
  ':house:': '🏠',
  ':moneybag:': '💰',
  ':sparkles:': '✨',
  ':bulb:': '💡',
  ':chart_with_upwards_trend:': '📈',
  ':thinking:': '🤔',
  ':brain:': '🧠',
};

function preprocessEmojis(content: string): string {
  let processed = content;
  for (const [shortcode, emoji] of Object.entries(CUSTOM_EMOJI_MAP)) {
    processed = processed.split(shortcode).join(emoji);
  }
  return processed;
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

export function MarkdownRenderer({ content, className, invert = false }: MarkdownRendererProps) {
  const processedContent = preprocessEmojis(content);

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
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkEmoji, remarkBreaks]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
