// Derived from shadcn/ui (popover) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import type * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { useOverlayMount, usePortalContainer } from "./theme-scope.js";
import { surfaceVariants } from "./surface.js";
import { cn } from "./utils.js";

export type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

function Popover({ ...props }: PopoverProps) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = usePortalContainer();
  const overlayMount = useOverlayMount();
  return (
    <PopoverPrimitive.Portal container={overlayMount ?? container}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-dropdown min-w-select-content-min origin-[--radix-popover-content-transform-origin] outline-none",
          surfaceVariants({ variant: "popover", elevation: 2, radius: "md", padding: "md" }),
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverAnchor, PopoverTrigger, PopoverContent };
