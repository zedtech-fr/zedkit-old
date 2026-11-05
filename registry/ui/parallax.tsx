import type * as React from "react";

import { cn } from "@/lib/utils";
import {
  isMovingDepth,
  motionVarClass,
  namedDepth,
  type ParallaxAxis,
  type ParallaxDepth,
  type ParallaxFade,
  type ParallaxOff,
  type ParallaxRange,
  type ParallaxSectionTag,
} from "@/components/ui/parallax-types";

export type {
  ParallaxAxis,
  ParallaxDepth,
  ParallaxDepthName,
  ParallaxFade,
  ParallaxOff,
  ParallaxRange,
  ParallaxSectionTag,
} from "@/components/ui/parallax-types";

export interface ParallaxSectionProps extends React.ComponentProps<"div"> {
  as?: ParallaxSectionTag | undefined;
  axis?: ParallaxAxis | undefined;
  range?: ParallaxRange | undefined;
  inset?: string | undefined;
  intensity?: number | undefined;
  preset?: string | undefined;
  off?: ParallaxOff | undefined;
}

export interface ParallaxLayerProps extends React.ComponentProps<"div"> {
  depth?: ParallaxDepth | undefined;
  axis?: ParallaxAxis | undefined;
  zoom?: readonly [number, number] | undefined;
  fade?: ParallaxFade | undefined;
  name?: string | undefined;
  /** Surface sets false so an interactive panel is not `aria-hidden`. */
  decorative?: boolean | undefined;
}

function ParallaxSection({
  as = "section",
  axis = "y",
  range = "cover",
  inset,
  intensity,
  preset,
  off,
  className,
  ...props
}: ParallaxSectionProps) {
  const Tag = as;
  return (
    <Tag
      data-slot="parallax-section"
      data-parallax=""
      data-parallax-axis={axis}
      data-parallax-range={range}
      {...(preset ? { "data-parallax-preset": preset } : {})}
      {...(off ? { "data-parallax-off": off } : {})}
      className={cn(
        "min-w-0",
        motionVarClass("--zk-motion-intensity", intensity),
        motionVarClass("--zk-parallax-inset", inset),
        className,
      )}
      {...props}
    />
  );
}

function layerFlags(depth: ParallaxDepth, fade: ParallaxFade | undefined, zoom: ParallaxLayerProps["zoom"]) {
  const moving = isMovingDepth(depth) && fade == null;
  return {
    moving,
    hide: moving || zoom != null || fade != null,
    named: namedDepth(depth),
  };
}

function ParallaxLayer({
  depth = 0,
  axis,
  zoom,
  fade,
  name,
  decorative,
  className,
  ...props
}: ParallaxLayerProps) {
  const flags = layerFlags(depth, fade, zoom);
  const hide = decorative ?? flags.hide;
  return (
    <div
      data-slot="parallax-layer"
      data-parallax-layer={name ?? ""}
      {...(flags.named != null ? { "data-parallax-depth": flags.named } : {})}
      {...(flags.moving ? { "data-parallax-move": "" } : {})}
      {...(axis ? { "data-parallax-axis": axis } : {})}
      {...(fade ? { "data-parallax-fade": fade } : {})}
      {...(zoom ? { "data-parallax-zoom": "" } : {})}
      {...(hide ? { "aria-hidden": true, inert: true } : {})}
      className={cn(
        "min-w-0",
        typeof depth === "number" && flags.named == null ? motionVarClass("--zk-depth", depth, true) : undefined,
        zoom ? motionVarClass("--zk-zoom-from", zoom[0]) : undefined,
        zoom ? motionVarClass("--zk-zoom-to", zoom[1]) : undefined,
        className,
      )}
      {...props}
    />
  );
}

export { ParallaxSection, ParallaxLayer };
