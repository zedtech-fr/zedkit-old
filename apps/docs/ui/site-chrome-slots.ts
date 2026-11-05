import { Sidebar, SidebarProvider, useSidebar } from "fumadocs-ui/layouts/docs/slots/sidebar";
import {
  SiteFullSearchTrigger,
  SiteSearchTrigger,
  SiteSidebarTrigger,
  SiteThemeSwitch,
} from "@/ui/site-chrome";

// Server-safe module on purpose: these objects are spread inside server layouts.
// Exported from the "use client" site-chrome.tsx they arrived as opaque client
// references, the spread copied nothing and fumadocs fell back to its default
// search/theme triggers (no "Search documentation" label, hidden icon trigger first).
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
