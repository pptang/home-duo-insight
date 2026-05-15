import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Editorial page section: a centred, max-width content well with consistent
 * horizontal padding. Replaces the copy-pasted
 *   `<section className="max-w-[860px] mx-auto px-6 pt-16 pb-20">`
 * blocks scattered across Landing / About / Feed, which had drifted to
 * slightly different widths and paddings.
 */
const widthClasses = {
  narrow: "max-w-[760px]",
  default: "max-w-[860px]",
  wide: "max-w-[1040px]",
  full: "max-w-[1240px]",
} as const;

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Content well max-width. */
  width?: keyof typeof widthClasses;
  /** Render as a different element (defaults to <section>). */
  as?: "section" | "div" | "main";
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, width = "default", as = "section", children, ...props }, ref) => {
    const Comp = as as React.ElementType;
    return (
      <Comp
        ref={ref}
        className={cn(widthClasses[width], "mx-auto px-6", className)}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Section.displayName = "Section";

/**
 * Full-width editorial divider: an {@link Eyebrow} caption flanked by hairline
 * rules that run to the edges of the content well. Used between major page
 * sections on Landing and About.
 */
export interface SectionDividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Caption text shown between the rules. */
  label: React.ReactNode;
  /** Content well max-width (matches the surrounding sections). */
  width?: keyof typeof widthClasses;
}

const SectionDivider = React.forwardRef<HTMLDivElement, SectionDividerProps>(
  ({ className, label, width = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(widthClasses[width], "mx-auto px-6 flex items-center gap-4", className)}
      {...props}
    >
      <div className="flex-1 h-px bg-rule" />
      <Eyebrow size="sm" tone="muted" className="whitespace-nowrap">
        {label}
      </Eyebrow>
      <div className="flex-1 h-px bg-rule" />
    </div>
  ),
);
SectionDivider.displayName = "SectionDivider";

export { Section, SectionDivider };
