// Derived from shadcn/ui (drawer) — see Provenance in packages/ui/README.md. Adapted: direction-aware
// positioning via data variants (vaul sets data-vaul-drawer-direction on the content), drag handle and
// close left to the consumer to compose, ref-as-prop (React 19). Vaul injects its own base CSS
// (drag transitions, open/close keyframes) at import; the kit retunes motion in styles.css.
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { buttonVariants } from "@/components/ui/button";
import { resolveModalMountAutoFocus, overlayDrawerFooterClass, overlayDrawerHeaderClass } from "@/components/ui/overlay-modal";
import { cn } from "@/lib/utils";
import { usePortalContainer } from "@/components/ui/theme-scope";
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
  ...props
}: DrawerRootProps) {
  const isMobile = useNarrowViewport();
  const resolvedDirection = resolveDrawerDirection(direction, mobile, isMobile) ?? "bottom";
  const mountAutoFocus = resolveModalMountAutoFocus(autoFocus, modal);
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      key={`${resolvedDirection}-${isMobile ? "narrow" : "wide"}`}
      direction={resolvedDirection}
      modal={modal}
      // eslint-disable-next-line jsx-a11y/no-autofocus -- Vaul prop; modal drawers must mount-focus inside so the trap engages.
      autoFocus={mountAutoFocus}
      {...props}
    />
  );
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerPortal({
  container,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const scoped = usePortalContainer();
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} container={container ?? scoped} />
  );
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
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
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  /**
   * Mirror of the `Drawer` root `modal` prop: `false` renders no
   * overlay so the background stays interactive. Defaults to `true`.
   */
  modal?: boolean;
}) {
  return (
    <DrawerPortal>
      {modal ? <DrawerOverlay /> : null}
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed z-overlay flex flex-col border bg-card text-card-foreground outline-none",
          // Safety net for content composed without DrawerHeader/Body/Footer (a bare form, text, a list): it still
          // gets the shared side gutters and a bottom inset that clears the home indicator. Buttons and the
          // kit slots keep their own spacing.
          "[&>:not([data-slot^=drawer-],[data-vaul-handle],button)]:px-4 [&>:not([data-slot^=drawer-],[data-vaul-handle],button):last-child]:pb-drawer-footer-safe",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-drawer-sheet-max-height data-[vaul-drawer-direction=bottom]:rounded-t-xl",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-drawer-sheet-max-height data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:pt-drawer-safe-top",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-drawer-side-mobile-width data-[vaul-drawer-direction=right]:pt-drawer-safe-top data-[vaul-drawer-direction=right]:pr-drawer-safe-right data-[vaul-drawer-direction=right]:max-sm:rounded-l-xl data-[vaul-drawer-direction=right]:sm:w-full data-[vaul-drawer-direction=right]:sm:max-w-drawer-side",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-drawer-side-mobile-width data-[vaul-drawer-direction=left]:pt-drawer-safe-top data-[vaul-drawer-direction=left]:pl-drawer-safe-left data-[vaul-drawer-direction=left]:max-sm:rounded-r-xl data-[vaul-drawer-direction=left]:sm:w-full data-[vaul-drawer-direction=left]:sm:max-w-drawer-side",
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHandle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
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

// Styled with buttonVariants rather than `asChild` so the copied registry file
// compiles with whichever Button flavour the target project ships (Slot or render prop).
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
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

type DrawerProps = DrawerRootProps;

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
