"use client";

import * as React from "react";

import { cn } from "./utils.js";

export type ScrollGalleryProps = React.ComponentProps<"div">;

/**
 * Single-row horizontal scroll region: snap, thin scrollbar, edge fade, and
 * focused children scroll into view (keyboard tabs and links).
 */
export function ScrollGallery({ className, children, ...props }: ScrollGalleryProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !track.contains(target)) return;
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    track.addEventListener("focusin", onFocusIn);
    return () => track.removeEventListener("focusin", onFocusIn);
  }, []);

  return (
    <div data-slot="scroll-gallery" className={cn("relative min-w-0", className)} {...props}>
      <div
        ref={trackRef}
        data-scroll-gallery-track=""
        className="flex min-w-0 snap-x snap-mandatory [scrollbar-width:thin] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:h-1"
      >
        {children}
      </div>
    </div>
  );
}
