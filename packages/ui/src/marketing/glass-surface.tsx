import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils.js";

// One surface for marketing sections. It rides on the card colour, so the
// glass identity turns it into frosted glass (blur, hairline edge) with no
// extra rule, and every other identity renders a plain raised card.

const glassSurfaceVariants = cva("relative rounded-2xl border bg-card text-card-foreground", {
  variants: {
    tone: {
      plain: "shadow-md",
      raised: "shadow-xl",
      tinted: "bg-linear-to-br from-accent/15 via-transparent to-primary/10 shadow-lg",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    tone: "plain",
    padding: "md",
  },
});

export type GlassSurfaceProps = React.ComponentProps<"div"> &
  VariantProps<typeof glassSurfaceVariants> & {
    /** Depth and wash: `plain`, `raised` (larger shadow), or `tinted` (accent wash). */
    tone?: "plain" | "raised" | "tinted" | undefined;
    /** Inner padding on the spacing scale. */
    padding?: "none" | "sm" | "md" | "lg" | undefined;
    /** Element to render, for landmarks and lists. */
    as?: "div" | "section" | "article" | "li" | undefined;
  };

function GlassSurface({ tone, padding, as = "div", className, ...props }: GlassSurfaceProps) {
  // The four tags share the div attributes this component accepts.
  const Tag = as as "div";
  return (
    <Tag
      data-slot="glass-surface"
      className={cn(glassSurfaceVariants({ tone, padding }), className)}
      {...props}
    />
  );
}

export { GlassSurface, glassSurfaceVariants };
