// Derived from shadcn/ui (dialog) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  overlayDialogCloseClass,
  overlayDialogFooterClass,
  overlayDialogHeaderClass,
} from "@/components/ui/overlay-modal";
import { usePortalContainer } from "@/components/ui/theme-scope";
import { useUiMessages } from "@/components/ui/ui-provider";

/** Air between the panel and the visual viewport edge (same 16px as the docs search sheet). */
const VIEWPORT_GUTTER_PX = 16;

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
  const scoped = usePortalContainer();
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal" {...props} container={container ?? scoped} />
  );
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string }) {
  const messages = useUiMessages();
  const fitRef = useDialogViewportFit<HTMLDivElement>();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    fitRef(node);
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        ref={setRef}
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus({ preventScroll: true });
        }}
        className={cn(
          "fixed dialog-center z-overlay grid max-h-dialog-max-height w-full max-w-dialog-mobile gap-4 overflow-y-auto overscroll-y-contain rounded-lg border bg-card p-dialog-padding text-card-foreground shadow-overlay outline-none focus:outline-none sm:max-w-lg",
          "motion-safe:data-[state=open]:animate-[zk-zoom-in_var(--motion-base)_var(--ease-enter)]",
          "motion-safe:data-[state=closed]:animate-[zk-zoom-out_var(--motion-base)_var(--ease-exit)]",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={overlayDialogCloseClass}>
          <X className="size-4" />
          <span className="sr-only">{closeLabel ?? messages.close}</span>
        </DialogPrimitive.Close>
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
