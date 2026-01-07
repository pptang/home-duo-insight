import ReactMarkdown from 'react-markdown';
import remarkEmoji from 'remark-emoji';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn(
      "prose prose-gray max-w-none",
      "prose-headings:text-primary prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3",
      "prose-h2:text-lg prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
      "prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3",
      "prose-ul:my-3 prose-ul:pl-5 prose-li:my-1 prose-li:text-foreground",
      "prose-strong:text-foreground prose-strong:font-semibold",
      "prose-hr:border-border prose-hr:my-6",
      "[&>*:first-child]:mt-0",
      className
    )}>
      <ReactMarkdown remarkPlugins={[remarkEmoji, remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
