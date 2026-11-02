// Derived from shadcn/ui (switch) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import type * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "./utils.js";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer hit-target inline-flex h-[calc(var(--spacing)*5)] w-[calc(var(--spacing)*9)] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm focus-ring transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block size-[calc(var(--spacing)*4)] rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[calc(var(--spacing)*5-4px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
