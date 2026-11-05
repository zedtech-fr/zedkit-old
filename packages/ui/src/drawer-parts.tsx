"use client";

import { X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { buttonVariants } from "./button.js";
import { overlayDrawerFooterClass, overlayDrawerHeaderClass } from "./overlay-modal.js";
import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";
import {
  NonModalDrawerClose,
} from "./drawer-non-modal.js";
import { useMaybeNonModalDrawer } from "./drawer-non-modal-context.js";

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  const inline = useMaybeNonModalDrawer();
  if (inline) {
    return <NonModalDrawerClose {...props} />;
  }
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
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

export { DrawerBody, DrawerClose, DrawerCloseButton, DrawerFooter, DrawerHeader };
