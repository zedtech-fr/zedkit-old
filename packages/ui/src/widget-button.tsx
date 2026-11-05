"use client";

import { Button, type ButtonProps } from "./button.js";
import { surfaceVariants } from "./surface.js";
import { cn } from "./utils.js";

export type WidgetButtonProps = ButtonProps;

/** Floating assistant / dock pill: outline control with shared surface elevation and radius. */
// `variant` is accepted for ButtonProps compatibility but always rendered as outline.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WidgetButton({ className, variant: _variant, size, ...props }: WidgetButtonProps) {
  return (
    <Button
      data-slot="widget-button"
      data-widget-button=""
      variant="outline"
      size={size}
      className={cn(
        surfaceVariants({ variant: "solid", elevation: 2, radius: "full", padding: "none" }),
        "w-auto max-w-full justify-between gap-2 px-4",
        className,
      )}
      {...props}
    />
  );
}

export { WidgetButton };
