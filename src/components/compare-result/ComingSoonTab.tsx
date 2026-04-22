import type { ReactNode } from 'react';

interface ComingSoonTabProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

export const ComingSoonTab = ({
  eyebrow,
  title,
  description,
  icon,
}: ComingSoonTabProps) => (
  <div className="border border-dashed border-rule rounded-lg bg-paper-dark/40 p-12 text-center">
    {icon && (
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-rule text-ink-60 mb-4" aria-hidden="true">
        {icon}
      </div>
    )}
    <div className="text-label-sm text-ink-30 mb-2">{eyebrow}</div>
    <h3 className="text-section text-ink mb-3">{title}</h3>
    <p className="text-[13px] text-ink-60 max-w-[520px] mx-auto leading-[1.7]">
      {description}
    </p>
    <div className="mt-5 inline-block text-label-xs text-ink-60 border border-rule rounded-sm px-3 py-1.5">
      準備中 · Coming soon
    </div>
  </div>
);
