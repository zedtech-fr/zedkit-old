"use client";

import type * as React from "react";
import {
  Button,
  cn,
  signatureMotionClass,
  type ButtonProps,
} from "@zedtech/zedkit-ui";

/** Docs-site chrome for the floating identity dock trigger (not published in @zedtech/zedkit-ui). */

type IdentityDockProps = React.ComponentProps<"div">;

function IdentityDock({ className, ...props }: IdentityDockProps) {
  return (
    <div
      data-slot="identity-dock"
      className={cn(
        "pointer-events-none fixed right-3 bottom-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:right-4 sm:bottom-4",
        className,
      )}
      {...props}
    />
  );
}

type IdentityDockTriggerProps = ButtonProps;

function IdentityDockTrigger({ className, ...props }: IdentityDockTriggerProps) {
  return (
    <Button
      type="button"
      data-slot="identity-dock-trigger"
      variant="outline"
      className={cn(
        "pointer-events-auto w-auto max-w-full justify-between gap-2 rounded-full px-4 shadow-md motion-safe:transition-transform motion-reduce:transition-none",
        signatureMotionClass.feedback,
        className,
      )}
      {...props}
    />
  );
}

type IdentityDockSwatchProps = React.ComponentProps<"span">;

function IdentityDockSwatch({ className, ...props }: IdentityDockSwatchProps) {
  return (
    <span
      data-slot="identity-dock-swatch"
      aria-hidden="true"
      className={cn("size-4 shrink-0 rounded-full border border-border/60 bg-primary", className)}
      {...props}
    />
  );
}

export { IdentityDock, IdentityDockSwatch, IdentityDockTrigger };
