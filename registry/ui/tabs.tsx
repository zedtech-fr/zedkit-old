// Derived from shadcn/ui (tabs) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import type * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>;

function Tabs({ ...props }: TabsProps) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-tabs-list-height max-w-full items-center justify-center overflow-x-auto rounded-lg bg-muted p-tabs-list-inset text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The list scrolls sideways when it must, which clips anything drawn outside its padding box. The trigger's
 * focus ring is therefore drawn inside it (offset by minus its own width), so keyboard focus is never cut off.
 */
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full cursor-pointer items-center justify-center rounded-md px-3 py-tabs-trigger-block text-sm font-medium whitespace-nowrap focus-ring transition-[color,background-color,box-shadow] focus-visible:-outline-offset-(--ring-width) disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("mt-2 focus-ring", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsProps };
