"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { DrawerHandle } from "./drawer.js";
import { signatureMotionClass } from "./type-roles.js";
import { cn } from "./utils.js";

type IdentityDockSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

/** Non-modal bottom sheet with peek / half / full detents (D2). */
function IdentityDockSheet({ open, onOpenChange, children, className }: IdentityDockSheetProps) {
  const [snap, setSnap] = React.useState<number | string | null>(0.55);
  return (
    <DrawerPrimitive.Root
      data-slot="identity-dock-sheet-root"
      open={open}
      modal={false}
      direction="bottom"
      snapPoints={[0.22, 0.55, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      fadeFromIndex={0}
      onOpenChange={onOpenChange}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Content
          data-slot="identity-dock-sheet"
          className={cn(
            signatureMotionClass.glide,
            "fixed inset-x-0 bottom-0 z-(--z-index-overlay) flex max-h-drawer-sheet-max-height flex-col overflow-hidden rounded-t-xl border border-border bg-background shadow-lg outline-none",
            className,
          )}
        >
          <DrawerHandle />
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export { IdentityDockSheet };
