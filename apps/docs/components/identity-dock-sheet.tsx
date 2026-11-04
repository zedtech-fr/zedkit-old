"use client";

import * as React from "react";
import { useState, type ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { DrawerHandle, Stack, cn, signatureMotionClass } from "@zedtech/zedkit-ui";

const SNAP_PEEK = 0.22;
const SNAP_HALF = 0.55;
const SNAP_FULL = 1;

type IdentityDockSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  "aria-label": string;
};

function useShortViewport(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia("(max-height: 600px)");
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-height: 600px)").matches,
    () => false,
  );
}

/** Non-modal bottom sheet with peek / half / full snap points (drag the handle only). */
function IdentityDockSheet({ open, onOpenChange, children, className, "aria-label": ariaLabel }: IdentityDockSheetProps) {
  const short = useShortViewport();
  const [snap, setSnap] = useState<number | string | null>(null);
  const base = snap ?? SNAP_FULL;
  const activeSnap = short && (base === SNAP_HALF || base === SNAP_FULL) ? SNAP_FULL : base;
  return (
    <DrawerPrimitive.Root
      data-slot="identity-dock-sheet-root"
      open={open}
      modal={false}
      direction="bottom"
      snapPoints={[SNAP_PEEK, SNAP_HALF, SNAP_FULL]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={setSnap}
      fadeFromIndex={0}
      onOpenChange={onOpenChange}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Content
          data-slot="identity-dock-sheet"
          aria-label={ariaLabel}
          className={cn(
            signatureMotionClass.glide,
            "fixed inset-x-0 bottom-0 z-(--z-index-overlay) flex max-h-drawer-sheet-max-height flex-col overflow-hidden rounded-t-xl border border-border bg-background shadow-lg outline-none",
            className,
          )}
        >
          <DrawerHandle
            className="mt-2 mb-1 h-1 w-10 shrink-0 bg-border/50 motion-reduce:opacity-100"
            aria-label="Drag to resize"
          />
          <Stack className="min-h-0 flex-1 gap-0 overflow-hidden">{children}</Stack>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export { IdentityDockSheet };
