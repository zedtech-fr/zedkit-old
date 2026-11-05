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
import { SidebarTrigger, useSidebar } from "fumadocs-ui/layouts/docs/slots/sidebar";
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
  return <FullSearchTrigger {...props} title={label} aria-label={label} data-search="" />;
}

export function SiteThemeSwitch({ className, mode = "light-dark" }: ThemeSwitchProps) {
  return (
    <div data-theme-toggle="" className="inline-flex shrink-0">
      <ThemeSwitch
        mode={mode}
        className={cn("h-control-height-sm shrink-0 gap-0.5 border-border/35 p-0.5", className)}
      />
    </div>
  );
}

export function SiteSidebarTrigger(props: ComponentProps<"button">) {
  const { open } = useSidebar();
  const label = open ? "Close navigation sidebar" : "Open navigation sidebar";
  return <SidebarTrigger title={label} {...props} />;
}
