"use client";

import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import {
  FullSearchTrigger,
  type FullSearchTriggerProps,
  type SearchTriggerProps,
} from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch, type ThemeSwitchProps } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "fumadocs-ui/layouts/docs/slots/sidebar";
import { IconButton, cn } from "@zedtech/zedkit-ui";

export function SiteSearchTrigger({ hideIfDisabled, className }: SearchTriggerProps) {
  const { setOpenSearch, enabled } = useSearchContext();
  if (hideIfDisabled && !enabled) return null;
  const label = "Search documentation";
  return (
    <IconButton
      label={label}
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setOpenSearch(true)}
      data-search=""
    >
      <Search />
    </IconButton>
  );
}

export function SiteFullSearchTrigger(props: FullSearchTriggerProps) {
  const label = "Search documentation";
  return <FullSearchTrigger {...props} title={label} aria-label={label} />;
}

export function SiteThemeSwitch({ className, mode = "light-dark" }: ThemeSwitchProps) {
  return (
    <ThemeSwitch
      mode={mode}
      className={cn("h-control-height-sm shrink-0 gap-0.5 border-border/35 p-0.5", className)}
    />
  );
}

export function SiteSidebarTrigger(props: ComponentProps<"button">) {
  const { open } = useSidebar();
  const label = open ? "Close navigation sidebar" : "Open navigation sidebar";
  return <SidebarTrigger title={label} {...props} />;
}

/** Fumadocs header slots shared by home and docs layouts. */
export const siteChromeSlots = {
  themeSwitch: SiteThemeSwitch,
  searchTrigger: {
    sm: SiteSearchTrigger,
    full: SiteFullSearchTrigger,
  },
} as const;

export const docsChromeSlots = {
  ...siteChromeSlots,
  sidebar: {
    provider: SidebarProvider,
    root: Sidebar,
    trigger: SiteSidebarTrigger,
    useSidebar,
  },
} as const;
