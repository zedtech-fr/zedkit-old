// Derived from shadcn/ui (drawer) — see Provenance in packages/ui/README.md. Adapted: direction-aware
// positioning via data variants (vaul sets data-vaul-drawer-direction on the content), drag handle and
// close left to the consumer to compose, ref-as-prop (React 19). Vaul injects its own base CSS
// (drag transitions, open/close keyframes) at import; the kit retunes motion in styles.css.
// `modal={false}` uses a kit inline panel (Surface + portal), not Vaul/Radix Dialog, so the page
// stays keyboard- and pointer-reachable.
"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import {
  NonModalDrawerContent,
  NonModalDrawerHandle,
  NonModalDrawerTrigger,
} from "@/components/ui/drawer-non-modal";
import { NonModalDrawerProvider, useMaybeNonModalDrawer } from "@/components/ui/drawer-non-modal-context";
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer-meta";
import {
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer-parts";
import { resolveDrawerDirection, type DrawerSize } from "@/components/ui/drawer-panel-classes";
import { type OverlayInitialFocus, resolveModalMountAutoFocus } from "@/components/ui/overlay-modal";
import { cn } from "@/lib/utils";
import { DrawerPortal } from "@/components/ui/drawer-portal";
import { DrawerVaulContent } from "@/components/ui/drawer-vaul";
import { useNarrowViewport } from "@/components/ui/use-narrow-viewport";

type DrawerRootProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /** On narrow viewports, map left/right to a bottom sheet (`sheet`) or side panel (`side`). */
  mobile?: "sheet" | "side";
};

function Drawer({
  mobile = "sheet",
  direction,
  modal = true,
  autoFocus,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  dismissible = true,
  children,
  ...props
}: DrawerRootProps) {
  const isMobile = useNarrowViewport();
  const resolvedDirection = resolveDrawerDirection(direction, mobile, isMobile) ?? "bottom";
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openProp === undefined) setUncontrolledOpen(next);
    },
    [onOpenChange, openProp],
  );

  if (!modal) {
    return (
      <NonModalDrawerProvider
        open={open}
        onOpenChange={setOpen}
        direction={resolvedDirection}
        dismissible={dismissible}
        triggerRef={triggerRef}
      >
        {children}
      </NonModalDrawerProvider>
    );
  }

  const mountAutoFocus = resolveModalMountAutoFocus(autoFocus, modal);
  const vaulOpenProps = {
    ...(openProp !== undefined ? { open: openProp } : { defaultOpen }),
    ...(onOpenChange !== undefined ? { onOpenChange } : {}),
  };
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      direction={resolvedDirection}
      modal={modal}
      dismissible={dismissible}
      // eslint-disable-next-line jsx-a11y/no-autofocus -- Vaul prop; modal drawers must mount-focus inside so the trap engages.
      autoFocus={mountAutoFocus}
      {...vaulOpenProps}
      {...props}
    >
      {children}
    </DrawerPrimitive.Root>
  );
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return <NonModalDrawerTrigger {...props} />;
  }
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerContent({
  className,
  children,
  modal = true,
  size = "md",
  initialFocus,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  modal?: boolean;
  size?: DrawerSize;
  initialFocus?: OverlayInitialFocus;
}) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return (
      <NonModalDrawerContent
        data-slot="drawer-content"
        className={className}
        size={size}
        ref={ref as React.Ref<HTMLDivElement>}
        {...props}
      >
        {children}
      </NonModalDrawerContent>
    );
  }
  return (
    <DrawerVaulContent
      data-slot="drawer-content"
      className={className}
      modal={modal}
      size={size}
      {...(initialFocus !== undefined ? { initialFocus } : {})}
      ref={ref}
      {...props}
    >
      {children}
    </DrawerVaulContent>
  );
}

function DrawerHandle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return <NonModalDrawerHandle className={className} {...props} />;
  }
  return (
    <DrawerPrimitive.Handle
      data-slot="drawer-handle"
      className={cn(
        "mx-auto mt-4 h-drawer-handle-height w-drawer-handle-width shrink-0 rounded-full bg-muted-foreground/50",
        "in-data-[vaul-drawer-direction=left]:hidden in-data-[vaul-drawer-direction=right]:hidden",
        "in-data-[vaul-drawer-direction=top]:order-last in-data-[vaul-drawer-direction=top]:mt-0 in-data-[vaul-drawer-direction=top]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

type DrawerProps = DrawerRootProps;

export type { DrawerSize };
export {
  Drawer,
  type DrawerProps,
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
export { DrawerOverlay } from "@/components/ui/drawer-vaul";
