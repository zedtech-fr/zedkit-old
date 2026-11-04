"use client";

import { useEffect } from "react";
import type * as React from "react";

import { observeAnimate, type AnimateOn } from "./animate-runtime.js";
import { cn } from "./utils.js";

export type { AnimateMotion, AnimateOn, AnimatePreset, AnimateTrigger } from "./animate-runtime.js";
export { ANIMATE_PRESETS, ANIMATE_TRIGGERS, observeAnimate } from "./animate-runtime.js";

export interface AnimateProps extends React.ComponentProps<"div"> {
  /** Trigger → motion map. `appear` also writes `data-animate`. */
  on?: AnimateOn;
  /** Appear delay in milliseconds (`data-animate-delay`). */
  delay?: number;
  /** Stagger children when appear runs. */
  stagger?: boolean;
}

function Animate({ on, delay, stagger, className, ...props }: AnimateProps) {
  return (
    <div
      {...props}
      data-slot="animate"
      {...(on?.appear != null ? { "data-animate": on.appear } : {})}
      {...(on?.scroll != null ? { "data-animate-scroll": on.scroll } : {})}
      {...(on?.press != null ? { "data-animate-press": on.press } : {})}
      {...(on?.longpress != null ? { "data-animate-longpress": on.longpress } : {})}
      {...(on?.hover != null ? { "data-animate-hover": on.hover } : {})}
      {...(on?.focus != null ? { "data-animate-focus": on.focus } : {})}
      {...(delay != null ? { "data-animate-delay": String(delay) } : {})}
      {...(stagger ? { "data-animate-stagger": "" } : {})}
      className={cn(className)}
    />
  );
}

/** Mount once near the app root so appear, scroll fallback and longpress run. */
function AnimateObserver(): null {
  useEffect(() => observeAnimate(), []);
  return null;
}

export { Animate, AnimateObserver };
