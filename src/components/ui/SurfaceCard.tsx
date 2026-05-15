import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Editorial surface card — the ruled, rounded panel used for feature tiles,
 * empty states, and call-out boxes across Landing / About / Feed. Distinct
 * from the shadcn `Card` (which is wired to the `--card` token); this one
 * speaks the paper/ink editorial palette directly so marketing surfaces stop
 * re-deriving `border border-rule rounded-lg bg-paper` by hand.
 */
const surfaceCardVariants = cva("rounded-lg border", {
  variants: {
    tone: {
      paper: "bg-paper border-rule",
      "paper-dark": "bg-paper-dark border-rule",
      ink: "bg-ink border-ink text-paper",
    },
    pad: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8 sm:p-12",
    },
  },
  defaultVariants: {
    tone: "paper",
    pad: "md",
  },
});

export interface SurfaceCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceCardVariants> {}

const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, tone, pad, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceCardVariants({ tone, pad }), className)}
      {...props}
    />
  ),
);
SurfaceCard.displayName = "SurfaceCard";

export { SurfaceCard, surfaceCardVariants };
