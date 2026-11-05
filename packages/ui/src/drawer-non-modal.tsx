"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { surfaceVariants } from "./surface.js";
import { OverlayMountContext, ScopePortal } from "./theme-scope.js";
import { cn } from "./utils.js";
import type { DrawerSize } from "./drawer-panel-classes.js";
import { drawerPanelClassName } from "./drawer-panel-classes.js";
import { useNonModalDrawer } from "./drawer-non-modal-context.js";

function NonModalDrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  const { asChild, children, ref: triggerRefProp, ...rest } = props;
  const { onOpenChange, triggerRef } = useNonModalDrawer();
  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof triggerRefProp === "function") triggerRefProp(node as HTMLButtonElement);
      else if (triggerRefProp) triggerRefProp.current = node as HTMLButtonElement;
    },
    [triggerRefProp, triggerRef],
  );
  const open = () => onOpenChange(true);
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      ref?: React.Ref<HTMLElement>;
      onClick?: React.MouseEventHandler;
    }>;
    return React.cloneElement(child, {
      ref: setRefs,
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        if (!event.defaultPrevented) open();
      },
    });
  }
  return (
    <button data-slot="drawer-trigger" type="button" ref={setRefs} onClick={open} {...rest}>
      {children}
    </button>
  );
}

function NonModalDrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  const { asChild, children, ref: closeRef, ...rest } = props;
  const { onOpenChange } = useNonModalDrawer();
  const close = () => onOpenChange(false);
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: React.MouseEventHandler }>;
    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        if (!event.defaultPrevented) close();
      },
    });
  }
  return (
    <button data-slot="drawer-close" type="button" ref={closeRef} onClick={close} {...rest}>
      {children}
    </button>
  );
}

function NonModalDrawerContent({
  className,
  children,
  size = "md",
  ref,
  ...props
}: React.ComponentProps<"div"> & { size?: DrawerSize }) {
  const ctx = useNonModalDrawer();
  const [mount, setMount] = React.useState<HTMLDivElement | null>(null);
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setMount(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  if (!ctx.open) return null;

  const labelledBy = ctx.titlePresent ? ctx.titleId : undefined;
  const describedBy = ctx.descriptionPresent ? ctx.descriptionId : undefined;

  return (
    <ScopePortal>
      <div
        role="dialog"
        data-slot="drawer-content"
        data-state="open"
        data-vaul-drawer-direction={ctx.direction}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        ref={setRef}
        tabIndex={-1}
        className={cn(
          surfaceVariants({ variant: "solid", elevation: 3, radius: "none", padding: "none" }),
          drawerPanelClassName(size, className),
          "outline-none",
        )}
        {...props}
      >
        <OverlayMountContext.Provider value={mount}>{children}</OverlayMountContext.Provider>
      </div>
    </ScopePortal>
  );
}

function NonModalDrawerTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  const { titleId, setTitlePresent } = useNonModalDrawer();
  React.useEffect(() => {
    setTitlePresent(true);
    return () => setTitlePresent(false);
  }, [setTitlePresent]);
  return (
    <h2
      data-slot="drawer-title"
      id={titleId}
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

function NonModalDrawerDescription({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const { descriptionId, setDescriptionPresent } = useNonModalDrawer();
  React.useEffect(() => {
    setDescriptionPresent(true);
    return () => setDescriptionPresent(false);
  }, [setDescriptionPresent]);
  return (
    <p
      data-slot="drawer-description"
      id={descriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function NonModalDrawerHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-handle"
      data-vaul-handle=""
      aria-hidden="true"
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

export {
  NonModalDrawerClose,
  NonModalDrawerContent,
  NonModalDrawerDescription,
  NonModalDrawerHandle,
  NonModalDrawerTitle,
  NonModalDrawerTrigger,
};
