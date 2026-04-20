import type { ReactNode } from 'react';

interface CompareSectionProps {
  eyebrow?: string;
  heading?: string;
  headingId?: string;
  children: ReactNode;
  className?: string;
}

export const CompareSection = ({
  eyebrow,
  heading,
  headingId,
  children,
  className = '',
}: CompareSectionProps) => (
  <section className={`max-w-[1040px] mx-auto px-6 ${className}`}>
    {(eyebrow || heading) && (
      <header className="mb-4">
        {eyebrow && (
          <div className="text-label-sm text-ink-60 mb-1">{eyebrow}</div>
        )}
        {heading && (
          <h2 id={headingId} className="text-section text-ink">
            {heading}
          </h2>
        )}
      </header>
    )}
    {children}
  </section>
);
