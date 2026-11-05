import { cn } from "./utils.js";

type DrawerSize = "sm" | "md" | "lg";
type DrawerDirection = "top" | "right" | "bottom" | "left";
type DrawerMobile = "sheet" | "side";

function resolveDrawerDirection(
  direction: DrawerDirection | undefined,
  mobile: DrawerMobile | undefined,
  isMobile: boolean,
): DrawerDirection | undefined {
  if (!isMobile || mobile === "side") {
    return direction;
  }
  if (direction === "left" || direction === "right") {
    return "bottom";
  }
  return direction;
}

const drawerSideRightMaxWidth: Record<DrawerSize, string> = {
  sm: "data-[vaul-drawer-direction=right]:sm:max-w-drawer-side-sm",
  md: "data-[vaul-drawer-direction=right]:sm:max-w-drawer-side",
  lg: "data-[vaul-drawer-direction=right]:sm:max-w-drawer-side-lg",
};

const drawerSideLeftMaxWidth: Record<DrawerSize, string> = {
  sm: "data-[vaul-drawer-direction=left]:sm:max-w-drawer-side-sm",
  md: "data-[vaul-drawer-direction=left]:sm:max-w-drawer-side",
  lg: "data-[vaul-drawer-direction=left]:sm:max-w-drawer-side-lg",
};

function drawerPanelClassName(size: DrawerSize, className?: string): string {
  return cn(
    "fixed z-drawer flex flex-col",
    "[&>:not([data-slot^=drawer-],[data-vaul-handle],button)]:px-4 [&>:not([data-slot^=drawer-],[data-vaul-handle],button):last-child]:pb-drawer-footer-safe",
    "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:max-h-drawer-sheet-max-height data-[vaul-drawer-direction=bottom]:rounded-t-xl",
    "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:max-h-drawer-sheet-max-height data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:pt-drawer-safe-top",
    "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-drawer-side-mobile-width data-[vaul-drawer-direction=right]:pt-drawer-safe-top data-[vaul-drawer-direction=right]:pr-drawer-safe-right data-[vaul-drawer-direction=right]:max-sm:rounded-l-xl data-[vaul-drawer-direction=right]:sm:w-full",
    drawerSideRightMaxWidth[size],
    "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-drawer-side-mobile-width data-[vaul-drawer-direction=left]:pt-drawer-safe-top data-[vaul-drawer-direction=left]:pl-drawer-safe-left data-[vaul-drawer-direction=left]:max-sm:rounded-r-xl data-[vaul-drawer-direction=left]:sm:w-full",
    drawerSideLeftMaxWidth[size],
    className,
  );
}

export { drawerPanelClassName, resolveDrawerDirection };
export type { DrawerSize };
