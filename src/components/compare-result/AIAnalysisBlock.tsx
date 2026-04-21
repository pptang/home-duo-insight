import type { ReactNode } from 'react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export type AIPointKind = 'pro-a' | 'pro-b' | 'caution';

export interface AIPoint {
  kind: AIPointKind;
  text: string;
}

interface AIAnalysisBlockProps {
  eyebrow?: string; // e.g. "AI サマリー"
  heading?: string;
  /** Markdown body; rendered with prose-invert because bg is ink */
  body: string;
  points?: AIPoint[];
  footer?: ReactNode;
  /** Optional model name shown as a small mono pill in the header (e.g. "Claude Sonnet 4") */
  modelBadge?: string;
  /**
   * Optional legal/disclaimer text rendered below footer.
   * Ordering rationale: body → points → footer (contextual actions/links) → disclaimer (legal boilerplate last).
   */
  disclaimer?: ReactNode;
}

const kindToStyle: Record<AIPointKind, string> = {
  'pro-a': 'border-paper/25 text-paper',
  'pro-b': 'border-paper/25 text-paper',
  caution: 'border-risk-med/60 text-risk-med',
};

const kindToLabel: Record<AIPointKind, string> = {
  'pro-a': 'A の強み',
  'pro-b': 'B の強み',
  caution: '留意点',
};

/** Mockup icons per kind: pro-b ◆, pro-a ◇, caution ⚠ */
const kindToIcon: Record<AIPointKind, string> = {
  'pro-a': '◇',
  'pro-b': '◆',
  caution: '⚠',
};

export const AIAnalysisBlock = ({
  eyebrow = 'AI サマリー',
  heading,
  body,
  points,
  footer,
  modelBadge,
  disclaimer,
}: AIAnalysisBlockProps) => (
  <div className="bg-ink text-paper rounded-lg p-6 sm:p-8 shadow-widget">
    {/* Header row: eyebrow/heading stack on the left, modelBadge pill on the right */}
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <div className="text-label-xs opacity-60 mb-1">{eyebrow}</div>
        {heading && (
          <h3 className="text-section text-paper">{heading}</h3>
        )}
      </div>
      {modelBadge && (
        <span className="shrink-0 font-mono text-[8px] text-white/60 border border-white/20 rounded-sm px-1.5 py-0.5 mt-0.5">
          {modelBadge}
        </span>
      )}
    </div>
    <div className="text-[14px] leading-[1.7] prose prose-invert max-w-none">
      <MarkdownRenderer content={body} />
    </div>
    {points && points.length > 0 && (
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {points.map((p, i) => (
          <li
            key={i}
            className={`text-label-xs border rounded-sm px-3 py-2 ${kindToStyle[p.kind]}`}
          >
            <span className="mr-1">{kindToIcon[p.kind]}</span>
            <span className="opacity-70 mr-2">{kindToLabel[p.kind]}</span>
            <span className="text-[12px] normal-case tracking-normal">
              {p.text}
            </span>
          </li>
        ))}
      </ul>
    )}
    {footer && <div className="mt-5 text-label-xs opacity-50">{footer}</div>}
    {disclaimer && (
      <div className="font-mono text-[9px] opacity-30 border-t border-white/10 pt-3 mt-3">
        {disclaimer}
      </div>
    )}
  </div>
);
