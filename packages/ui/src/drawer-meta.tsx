"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { NonModalDrawerDescription, NonModalDrawerTitle } from "./drawer-non-modal.js";
import { useMaybeNonModalDrawer } from "./drawer-non-modal-context.js";
import { cn } from "./utils.js";

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return <NonModalDrawerTitle className={className} {...props} />;
  }
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return <NonModalDrawerDescription className={className} {...props} />;
  }
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { DrawerDescription, DrawerTitle };
