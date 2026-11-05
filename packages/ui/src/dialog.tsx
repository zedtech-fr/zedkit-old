// Derived from shadcn/ui (dialog) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./utils.js";
import {
  focusOverlayInitial,
  overlayDialogCloseClass,
  overlayDialogFooterClass,
  overlayDialogHeaderClass,
  type OverlayInitialFocus,
  useExitUnmountFallback,
} from "./overlay-modal.js";
import { OverlayMountContext, ScopePortal } from "./theme-scope.js";
import { Surface } from "./surface.js";
import { useUiMessages } from "./ui-provider.js";

/** Air between the panel and the visual viewport edge (same 16px as the docs search sheet). */
const VIEWPORT_GUTTER_PX = 16;

const dialogContentClass =
  "fixed dialog-center z-dialog grid max-h-dialog-max-height w-full max-w-dialog-mobile gap-4 overflow-y-auto overscroll-y-contain outline-none focus:outline-none sm:max-w-lg motion-safe:data-[state=open]:animate-[zk-zoom-in_var(--motion-base)_var(--ease-enter)] motion-safe:data-[state=closed]:animate-[zk-zoom-out_var(--motion-base)_var(--ease-exit)]";

function useDialogViewportFit<T extends HTMLElement>(): React.RefCallback<T> {
  const nodeRef = React.useRef<T | null>(null);
  const apply = React.useCallback(() => {
    const node = nodeRef.current;
    const viewport = window.visualViewport;
    if (!node) return;
    if (!viewport) {
      node.style.maxHeight = "";
      node.style.top = "";
      return;
    }
    const height = Math.max(0, viewport.height - VIEWPORT_GUTTER_PX);
    node.style.maxHeight = `min(var(--spacing-dialog-max-height), ${height}px)`;
    node.style.top = `${viewport.offsetTop + viewport.height / 2}px`;
  }, []);

  React.useLayoutEffect(() => {
    apply();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", apply);
    viewport?.addEventListener("scroll", apply);
    return () => {
      viewport?.removeEventListener("resize", apply);
      viewport?.removeEventListener("scroll", apply);
      const node = nodeRef.current;
      if (node) {
        node.style.maxHeight = "";
        node.style.top = "";
      }
    };
  }, [apply]);

  return (node) => {
    nodeRef.current = node;
    apply();
  };
}

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Dialog({ ...props }: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  // Default mount is document.body: a scoped mount inherits whatever stacking context traps the trigger
  // (a transform, filter, or isolation) and the site header then paints above the overlay. An explicit
  // `container` still wins for consumers that need a subtree mount.
  // Plain `createPortal`, not the Radix portal: Radix wraps each portal child in a Presence that unmounts
  // instantly when the child has no exit animation, and the child here is the ScopeMirror (a plain
  // look-carrying div), which would swallow the overlay/panel exit. The overlay and panel keep their own
  // inner Presences, which own the exit lifecycle (closed state, animationend/cancel, instant when reduced
  // motion removes the animations).
  return <ScopePortal container={container}>{props.children}</ScopePortal>;
}

function DialogOverlay({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
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
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      ref={setRef}
      className={cn(
        "fixed inset-0 z-overlay bg-overlay/80",
        "motion-safe:data-[state=open]:animate-[zk-fade-in_var(--motion-base)_var(--ease-enter)]",
        "motion-safe:data-[state=closed]:animate-[zk-fade-out_var(--motion-base)_var(--ease-exit)]",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  closeLabel,
  initialFocus,
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel?: string;
  /**
   * Opt-in field to focus on open (a ref, or a selector resolved inside the
   * panel). Without it focus lands on the panel itself, never inside a
   * field; a focused field gets the caret at the end, never a selection.
   */
  initialFocus?: OverlayInitialFocus;
}) {
  const messages = useUiMessages();
  const fitRef = useDialogViewportFit<HTMLDivElement>();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [mount, setMount] = React.useState<HTMLDivElement | null>(null);
  const exitRef = useExitUnmountFallback<HTMLDivElement>();
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      setMount(node);
      fitRef(node);
      exitRef(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [exitRef, fitRef, ref],
  );
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRef}
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusOverlayInitial(contentRef.current, initialFocus);
        }}
        {...props}
        asChild
      >
        <Surface
          data-slot="dialog-content"
          variant="solid"
          elevation={3}
          radius="lg"
          padding="dialog"
          className={cn(dialogContentClass, className)}
        >
          <OverlayMountContext.Provider value={mount}>{children}</OverlayMountContext.Provider>
          <DialogPrimitive.Close className={overlayDialogCloseClass}>
            <X className="size-4" />
            <span className="sr-only">{closeLabel ?? messages.close}</span>
          </DialogPrimitive.Close>
        </Surface>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(overlayDialogHeaderClass, className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(overlayDialogFooterClass, className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  type DialogProps,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
