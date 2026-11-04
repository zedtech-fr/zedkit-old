"use client";

import * as React from "react";
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
  children: React.ReactNode;
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
  const [snap, setSnap] = React.useState<number | string | null>(SNAP_HALF);
  return (
    <DrawerPrimitive.Root
      data-slot="identity-dock-sheet-root"
      open={open}
      modal={false}
      direction="bottom"
      snapPoints={[SNAP_PEEK, SNAP_HALF, SNAP_FULL]}
      activeSnapPoint={snap}
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
            snap={snap}
            onSnap={setSnap}
            detentGroupLabel={detentGroupLabel}
            detentLabels={detentLabels}
          />
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export { IdentityDockSheet };
