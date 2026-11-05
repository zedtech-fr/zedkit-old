"use client";

import type * as React from "react";
import {
  cn,
  signatureMotionClass,
  Text,
  WidgetButton,
  type ButtonProps,
} from "@zedtech/zedkit-ui";

/** Docs-site chrome for the floating identity dock trigger (not published in @zedtech/zedkit-ui). */

type IdentityDockProps = React.ComponentProps<"div">;

function IdentityDock({ className, children, ...props }: IdentityDockProps) {
  return (
    <div
      data-slot="identity-dock"
      data-demo-specimen=""
      className={cn(
        "pointer-events-none fixed right-3 bottom-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:right-4 sm:bottom-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type IdentityDockTriggerProps = ButtonProps;

function IdentityDockTrigger({ className, ...props }: IdentityDockTriggerProps) {
  return (
    <WidgetButton
      data-slot="identity-dock-trigger"
      className={cn(
        "pointer-events-auto motion-safe:transition-transform motion-reduce:transition-none",
        signatureMotionClass.feedback,
        className,
      )}
      {...props}
    />
  );
}

type IdentityDockSwatchProps = React.ComponentProps<"span">;

function IdentityDockSwatch({ className }: IdentityDockSwatchProps) {
  return (
    <Text
      as="span"
      data-slot="identity-dock-swatch"
      aria-hidden="true"
      className={cn("inline-block size-4 shrink-0 rounded-full border border-border/60 bg-primary", className)}
    />
  );
}

export { IdentityDock, IdentityDockSwatch, IdentityDockTrigger };
