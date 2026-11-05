// Derived from shadcn/ui (drawer) — see Provenance in packages/ui/README.md. Adapted: direction-aware
// positioning via data variants (vaul sets data-vaul-drawer-direction on the content), drag handle and
// close left to the consumer to compose, ref-as-prop (React 19). Vaul injects its own base CSS
// (drag transitions, open/close keyframes) at import; the kit retunes motion in styles.css.
// `modal={false}` uses a kit inline panel (Surface + portal), not Vaul/Radix Dialog, so the page
// stays keyboard- and pointer-reachable.
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { buttonVariants } from "@/components/ui/button";
import {
  NonModalDrawerClose,
  NonModalDrawerContent,
  NonModalDrawerDescription,
  NonModalDrawerHandle,
  NonModalDrawerProvider,
  NonModalDrawerTitle,
  NonModalDrawerTrigger,
  useMaybeNonModalDrawer,
} from "@/components/ui/drawer-non-modal";
import { drawerPanelClassName, type DrawerSize } from "@/components/ui/drawer-panel-classes";
import {
  focusOverlayInitial,
  type OverlayInitialFocus,
  overlayDrawerFooterClass,
  overlayDrawerHeaderClass,
  resolveModalMountAutoFocus,
  useExitUnmountFallback,
} from "@/components/ui/overlay-modal";
import { cn } from "@/lib/utils";
import { surfaceVariants } from "@/components/ui/surface";
import { OverlayMountContext, ScopePortal } from "@/components/ui/theme-scope";
import { useNarrowViewport } from "@/components/ui/use-narrow-viewport";
import { useUiMessages } from "@/components/ui/ui-provider";

type DrawerRootProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * On narrow viewports, map left/right drawers to a bottom sheet (`sheet`) or keep a side panel (`side`,
   * full height, up to 90% of the width so the dimmed page stays tappable). Defaults to `sheet`.
   */
  mobile?: "sheet" | "side";
};

function resolveDrawerDirection(
  direction: DrawerRootProps["direction"],
  mobile: DrawerRootProps["mobile"],
  isMobile: boolean,
): DrawerRootProps["direction"] {
  if (!isMobile || mobile === "side") {
    return direction;
  }
  if (direction === "left" || direction === "right") {
    return "bottom";
  }
  return direction;
}

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
      key={`${resolvedDirection}-${isMobile ? "narrow" : "wide"}`}
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

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return <NonModalDrawerClose {...props} />;
  }
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerPortal({
  container,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  // Default mount is document.body: a scoped mount inherits whatever stacking context traps the trigger
  // (a transform, filter, or isolation) and the site header then paints above the overlay. An explicit
  // `container` still wins for consumers that need a subtree mount.
  // Plain `createPortal`, not the vaul/Radix portal: Radix wraps each portal child in a Presence that
  // unmounts instantly when the child has no exit animation, and the child here is the ScopeMirror (a
  // plain look-carrying div), which would swallow the overlay/panel exit. The overlay and panel keep their
  // own inner Presences, which own the exit lifecycle (closed state, animationend/cancel, instant when
  // reduced motion removes the animations).
  return <ScopePortal container={container}>{props.children}</ScopePortal>;
}

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

function DrawerContent({
  className,
  children,
  modal = true,
  size = "md",
  initialFocus,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  /**
   * Mirror of the `Drawer` root `modal` prop: `false` renders no
   * overlay so the background stays interactive. Defaults to `true`.
   */
  modal?: boolean;
  /** Side-panel width on desktop (`sm` 24rem, `md` 28rem default, `lg` min(600px, 92vw)). */
  size?: DrawerSize;
  /**
   * Opt-in field to focus on open (a ref, or a selector resolved inside the
   * panel). Without it focus lands on the panel itself, never inside a
   * field; a focused field gets the caret at the end, never a selection.
   */
  initialFocus?: OverlayInitialFocus;
}) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return (
      <NonModalDrawerContent className={className} size={size} ref={ref as React.Ref<HTMLDivElement>} {...props}>
        {children}
      </NonModalDrawerContent>
    );
  }

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

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(overlayDrawerHeaderClass, className)}
      {...props}
    />
  );
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 last:pb-drawer-safe-bottom", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(overlayDrawerFooterClass, className)}
      {...props}
    />
  );
}

function DrawerCloseButton({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerClose>) {
  const messages = useUiMessages();
  return (
    <DrawerClose
      data-slot="drawer-close-button"
      type="button"
      aria-label={messages.close}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "size-overlay-touch-target shrink-0",
        className,
      )}
      {...props}
    >
      {children ?? <X className="size-4" />}
    </DrawerClose>
  );
}

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
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
