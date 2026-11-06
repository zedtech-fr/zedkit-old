import type { Viewport } from "next";
import { DOCS_THEME_COLOR_DARK, DOCS_THEME_COLOR_LIGHT } from "@/lib/docs-theme-color";

/** Browser chrome colour before hydration (docs shell background); `ThemeColorMeta` then follows the active theme. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: DOCS_THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: DOCS_THEME_COLOR_DARK },
  ],
};
