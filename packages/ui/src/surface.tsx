import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { ParallaxLayer } from "./parallax.js";
import { isMovingDepth } from "./parallax-types.js";
import { cn } from "./utils.js";

const surfaceVariants = cva("", {
  variants: {
    variant: {
      solid: "border bg-card text-card-foreground",
      popover: "border bg-popover text-popover-foreground",
      /** Frosted panel under the glass identity; solid popover panel otherwise (`surface.css`). */
      glass: "border text-popover-foreground",
    },
    elevation: {
      0: "shadow-none",
      1: "shadow-sm",
      2: "shadow-md",
      3: "shadow-overlay",
    },
    radius: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    },
    padding: {
      none: "",
      sm: "p-2",
      md: "p-4",
      card: "p-card-padding",
      dialog: "p-dialog-padding",
    },
  },
  defaultVariants: {
    variant: "solid",
    elevation: 2,
    radius: "xl",
    padding: "none",
  },
});

export type SurfaceProps = React.ComponentProps<"div"> &
  Omit<VariantProps<typeof surfaceVariants>, "variant"> & {
    as?: "div" | "section" | "article" | undefined;
  } & (
    | {
        variant?: "solid" | "popover" | undefined;
        depth?: "far" | "back" | "mid" | "near" | "0" | number | undefined;
        layerClassName?: string | undefined;
      }
    | {
        variant: "glass";
        depth?: never;
        layerClassName?: never;
      }
  );

function Surface({
  as = "div",
  variant,
  elevation,
  radius,
  padding,
  className,
  depth,
  layerClassName,
  ...props
}: SurfaceProps) {
  const Tag = as;
  const surface = (
    <Tag
      data-slot="surface"
      data-surface={variant === "glass" ? "glass" : undefined}
      className={cn(surfaceVariants({ variant, elevation, radius, padding }), className)}
      {...props}
    />
  );
  if (variant === "glass" || !isMovingDepth(depth)) return surface;
  return (
    <ParallaxLayer depth={depth} className={layerClassName} decorative={false}>
      {surface}
    </ParallaxLayer>
  );
}

export { Surface, surfaceVariants };

/** Class names for a frosted panel (`data-surface="glass"` + elevation/radius tokens). */
function surfaceGlassPanelClass(
  options?: Pick<VariantProps<typeof surfaceVariants>, "elevation" | "radius" | "padding">,
) {
  return cn(
    surfaceVariants({
      variant: "glass",
      elevation: 3,
      radius: "xl",
      padding: "none",
      ...options,
    }),
  );
}

/** Apply kit glass panel chrome to a host fumadocs (or other) renders without a React seam. */
function applySurfaceGlassPanel(
  element: HTMLElement,
  options?: Pick<VariantProps<typeof surfaceVariants>, "elevation" | "radius" | "padding">,
) {
  element.setAttribute("data-surface", "glass");
  element.className = cn(element.className, surfaceGlassPanelClass(options));
}

export { applySurfaceGlassPanel, surfaceGlassPanelClass };
