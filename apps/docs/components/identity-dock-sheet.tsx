"use client";

import { useState, type ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import {
  Button,
  DrawerHandle,
  Stack,
  cn,
  signatureMotionClass,
} from "@zedtech/zedkit-ui";

const SNAP_PEEK = 0.22;
const SNAP_HALF = 0.55;
const SNAP_FULL = 1;

export type IdentityDockSheetDetentLabels = {
  peek: string;
  half: string;
  full: string;
};

type IdentityDockSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  "aria-label": string;
  detentGroupLabel: string;
  detentLabels: IdentityDockSheetDetentLabels;
};

function IdentityDockSheetDetents({
  snap,
  onSnap,
  detentGroupLabel,
  detentLabels,
}: {
  snap: number | string | null;
  onSnap: (next: number) => void;
  detentGroupLabel: string;
  detentLabels: IdentityDockSheetDetentLabels;
}) {
  const rows: { value: number; label: string }[] = [
    { value: SNAP_PEEK, label: detentLabels.peek },
    { value: SNAP_HALF, label: detentLabels.half },
    { value: SNAP_FULL, label: detentLabels.full },
  ];
  return (
    <Stack
      direction="horizontal"
      gap={2}
      role="group"
      aria-label={detentGroupLabel}
      className="shrink-0 justify-center px-3 pt-2 pb-1"
    >
      {rows.map((row) => (
        <Button
          key={row.value}
          type="button"
          size="sm"
          variant={snap === row.value ? "secondary" : "outline"}
          aria-pressed={snap === row.value}
          onClick={() => onSnap(row.value)}
        >
          {row.label}
        </Button>
      ))}
    </Stack>
  );
}

/** Non-modal bottom sheet with peek / half / full detents (docs IdentityDock only). */
function IdentityDockSheet({
  open,
  onOpenChange,
  children,
  className,
  "aria-label": ariaLabel,
  detentGroupLabel,
  detentLabels,
}: IdentityDockSheetProps) {
  const [snap, setSnap] = useState<number | string | null>(null);
  // Full by default: fractional snaps translate the sheet down, hiding bottom-anchored content (the composer and
  // the status line) at peek and half. The visitor can still drop to a lower detent with the buttons above.
  const activeSnap = snap ?? SNAP_FULL;
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
          <DrawerHandle />
          <IdentityDockSheetDetents
            snap={activeSnap}
            onSnap={setSnap}
            detentGroupLabel={detentGroupLabel}
            detentLabels={detentLabels}
          />
          <Stack className="min-h-0 flex-1 gap-0 overflow-hidden">{children}</Stack>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export { IdentityDockSheet };
