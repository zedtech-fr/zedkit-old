import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils.js";

export type StickyAsideSide = "left" | "right" | "start" | "end";
export type StickyAsideGap = "sm" | "md" | "lg";
export type StickyAsideFrom = "md" | "lg";
export type StickyAsideMobile = "before" | "after" | "stack-before" | "stack-after";
export type StickyAsideRatioPreset = "1/3" | "2/5" | "1/2";

function resolveSide(side: StickyAsideSide): "left" | "right" {
  if (side === "left" || side === "start") return "left";
  return "right";
}

function resolveMobile(mobile: StickyAsideMobile): "before" | "after" {
  return mobile === "before" || mobile === "stack-before" ? "before" : "after";
}

export interface StickyAsideProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Which side holds the sticky column at the active breakpoint. */
  side?: StickyAsideSide | undefined;
  /** Column split preset (`--zk-sticky-cols` presets); pass a full template via `className` (`[--zk-sticky-cols:…]`). */
  ratio?: StickyAsideRatioPreset | undefined;
  /** Gap between columns (`--zk-sticky-gap`). */
  gap?: StickyAsideGap | undefined;
  /** Breakpoint where the two-column sticky layout activates. */
  breakpoint?: StickyAsideFrom | undefined;
  /** Alias of `breakpoint` (motion spec). */
  from?: StickyAsideFrom | undefined;
  /** Stack order on narrow viewports; DOM order stays main then aside. */
  mobile?: StickyAsideMobile | undefined;
  /** When the aside is taller than the viewport: sticky plus internal scroll. */
  scrollable?: boolean | undefined;
  children: React.ReactNode;
}

/**
 * Two-column layout: the main column scrolls with the page; the aside stays
 * visible with `position: sticky` until the section ends. Pure CSS (see
 * `sticky-aside.css`). Keep ancestors between this root and the viewport free
 * of `overflow: hidden|auto|scroll` and of transforms, or sticky will not
 * reach the window.
 */
function StickyAside({
  side = "right",
  ratio,
  gap = "md",
  breakpoint = "lg",
  from,
  mobile = "after",
  scrollable = false,
  className,
  children,
  ...props
}: StickyAsideProps) {
  const activeFrom = from ?? breakpoint;

  return (
    <div
      data-slot="sticky-aside"
      data-sticky-aside=""
      data-side={resolveSide(side)}
      data-gap={gap}
      data-from={activeFrom}
      data-mobile={resolveMobile(mobile)}
      {...(scrollable ? { "data-scrollable": "" } : {})}
      {...(ratio ? { "data-ratio": ratio } : {})}
      className={cn("min-w-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export type StickyAsideMainProps = React.ComponentProps<"div">;

function StickyAsideMain({ className, ...props }: StickyAsideMainProps) {
  return <div data-sticky-aside-main="" className={cn("min-w-0", className)} {...props} />;
}

export interface StickyAsideAsideProps extends React.ComponentProps<"aside"> {
  asChild?: boolean | undefined;
}

function StickyAsideAside({ asChild = false, className, ...props }: StickyAsideAsideProps) {
  const Comp = asChild ? Slot : "aside";
  return <Comp data-sticky-aside-aside="" className={cn("min-w-0", className)} {...props} />;
}

StickyAside.Main = StickyAsideMain;
StickyAside.Aside = StickyAsideAside;

export { StickyAside, StickyAsideMain, StickyAsideAside };
