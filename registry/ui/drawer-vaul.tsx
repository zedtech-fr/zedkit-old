"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { drawerPanelClassName, type DrawerSize } from "@/components/ui/drawer-panel-classes";
import {
  focusOverlayInitial,
  type OverlayInitialFocus,
  useExitUnmountFallback,
} from "@/components/ui/overlay-modal";
import { cn } from "@/lib/utils";
import { surfaceVariants } from "@/components/ui/surface";
import { OverlayMountContext } from "@/components/ui/theme-scope";
import { DrawerPortal } from "@/components/ui/drawer-portal";

function DrawerOverlay({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  const exitRef = useExitUnmountFallback<HTMLDivElement>();
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      exitRef(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [exitRef, ref],
  );
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      ref={setRef}
      className={cn(
        "fixed inset-0 z-overlay bg-overlay/50 backdrop-blur-sm",
        "motion-safe:data-[state=open]:animate-[zk-fade-in_var(--motion-base)_var(--ease-enter)]",
        "motion-safe:data-[state=closed]:animate-[zk-fade-out_var(--motion-base)_var(--ease-exit)]",
        className,
      )}
      {...props}
    />
  );
}

function DrawerVaulContent({
  className,
  children,
  modal,
  size = "md",
  initialFocus,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  modal: boolean;
  size?: DrawerSize;
  initialFocus?: OverlayInitialFocus;
}) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [mount, setMount] = React.useState<HTMLDivElement | null>(null);
  const exitRef = useExitUnmountFallback<HTMLDivElement>();
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      setMount(node);
      exitRef(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [exitRef, ref],
  );
  return (
    <DrawerPortal>
      {modal ? <DrawerOverlay /> : null}
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        ref={setRef}
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          if (!modal) return;
          event.preventDefault();
          focusOverlayInitial(contentRef.current, initialFocus);
        }}
        className={cn(
          drawerPanelClassName(size, className),
          "outline-none",
          surfaceVariants({ variant: "solid", elevation: 3, radius: "none", padding: "none" }),
        )}
        {...props}
      >
        <OverlayMountContext.Provider value={mount}>{children}</OverlayMountContext.Provider>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

export { DrawerOverlay, DrawerVaulContent };
