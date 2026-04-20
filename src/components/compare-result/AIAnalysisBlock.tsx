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

export const AIAnalysisBlock = ({
  eyebrow = 'AI サマリー',
  heading,
  body,
  points,
  footer,
}: AIAnalysisBlockProps) => (
  <div className="bg-ink text-paper rounded-lg p-6 sm:p-8 shadow-widget">
    <div className="text-label-xs opacity-60 mb-3">{eyebrow}</div>
    {heading && (
      <h3 className="text-section text-paper mb-4">{heading}</h3>
    )}
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
            <span className="opacity-70 mr-2">{kindToLabel[p.kind]}</span>
            <span className="text-[12px] normal-case tracking-normal">
              {p.text}
            </span>
          </li>
        ))}
      </ul>
    )}
    {footer && <div className="mt-5 text-label-xs opacity-50">{footer}</div>}
  </div>
);
