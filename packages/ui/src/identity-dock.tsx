"use client";

import type * as React from "react";

import { Button, type ButtonProps } from "./button.js";
import { cn } from "./utils.js";

type IdentityDockProps = React.ComponentProps<"div">;

/** Fixed host for the floating identity dock (pill + panel). Children manage pointer-events. */
function IdentityDock({ className, ...props }: IdentityDockProps) {
  return (
    <div
      data-slot="identity-dock"
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-index-overlay) flex flex-col items-stretch gap-2 p-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:items-end sm:p-0",
        className,
      )}
      {...props}
    />
  );
}

type IdentityDockTriggerProps = ButtonProps;

/** Collapsed entry: pill on desktop, full-width bar on narrow viewports. */
function IdentityDockTrigger({ className, ...props }: IdentityDockTriggerProps) {
  return (
    <Button
      type="button"
      data-slot="identity-dock-trigger"
      variant="outline"
      className={cn(
        "w-full justify-between shadow-md motion-safe:transition-transform motion-reduce:transition-none sm:w-auto sm:rounded-full sm:px-4",
        className,
      )}
      {...props}
    />
  );
}

type IdentityDockPanelProps = React.ComponentProps<"aside"> & {
  open: boolean;
};

/** Non-modal side sheet (desktop). Does not trap focus or block the page. */
function IdentityDockPanel({ open, className, children, ...props }: IdentityDockPanelProps) {
  return (
    <aside
      data-slot="identity-dock-panel"
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      className={cn(
        "flex max-h-drawer-sheet-max-height w-full flex-col overflow-hidden rounded-t-lg border border-border bg-background shadow-lg motion-safe:transition-[transform,opacity] motion-reduce:transition-none sm:w-full sm:max-w-sm sm:rounded-lg",
        open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 sm:translate-y-2 sm:opacity-0",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
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

export { IdentityDock, IdentityDockPanel, IdentityDockSwatch, IdentityDockTrigger };
export { IdentityDockSheet } from "./identity-dock-sheet.js";
