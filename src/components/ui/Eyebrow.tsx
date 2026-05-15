import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial mono micro-label. Two shapes:
 *  - default: a bare uppercase mono caption
 *  - rules: the caption flanked by two short horizontal rules (the hero /
 *    section-divider treatment used across Landing and About)
 *
 * Centralising this kills the copy-pasted
 *   `<span className="font-mono text-[11px] uppercase tracking-[0.12em] ...">`
 * blocks that previously drifted between pages.
 */
export interface EyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render flanking rules on either side of the label. */
  rules?: boolean;
  /** Visual size of the label. */
  size?: "sm" | "md";
  /** Text tone. */
  tone?: "default" | "muted";
}

const sizeClasses: Record<NonNullable<EyebrowProps["size"]>, string> = {
  sm: "text-[10px] tracking-[0.12em]",
  md: "text-[11px] tracking-[0.12em]",
};

const toneClasses: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  default: "text-ink-60",
  muted: "text-ink-30",
};

const Eyebrow = React.forwardRef<HTMLDivElement, EyebrowProps>(
  ({ className, rules = false, size = "md", tone = "default", children, ...props }, ref) => {
    const label = (
      <span className={cn("font-mono uppercase", sizeClasses[size], toneClasses[tone])}>
        {children}
      </span>
    );

    if (!rules) {
      return (
        <div ref={ref} className={cn("inline-flex", className)} {...props}>
          {label}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center gap-2.5", className)}
        {...props}
      >
        <span className="block w-7 h-px bg-ink/30" aria-hidden="true" />
        {label}
        <span className="block w-7 h-px bg-ink/30" aria-hidden="true" />
      </div>
    );
  },
);
Eyebrow.displayName = "Eyebrow";

export { Eyebrow };
