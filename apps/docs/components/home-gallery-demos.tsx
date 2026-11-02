"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import { HOME_GALLERY_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";

function DemoFallback() {
  return (
    <Stack className={HOME_GALLERY_PREVIEW_SHELL_CLASS} aria-hidden="true" data-home-gallery-preview="" />
  );
}

/** Only the demos the home page renders — not the full docs registry. */
export const homeGalleryDemos: Record<string, ComponentType> = {
  BadgeDemo: dynamic(
    () => import("@/ui/home/home-gallery-preview").then((mod) => mod.HomeBadgePreview),
    { loading: DemoFallback, ssr: false },
  ),
  ButtonDemo: dynamic(
    () => import("@/ui/home/home-gallery-preview").then((mod) => mod.HomeButtonPreview),
    { loading: DemoFallback, ssr: false },
  ),
  InputDemo: dynamic(
    () => import("@/ui/home/home-gallery-preview").then((mod) => mod.HomeInputPreview),
    { loading: DemoFallback, ssr: false },
  ),
  ConfirmDialogDemo: dynamic(
    () => import("@/ui/home/home-gallery-preview").then((mod) => mod.HomeConfirmDialogPreview),
    { loading: DemoFallback, ssr: false },
  ),
  DrawerDemo: dynamic(
    () => import("@/ui/home/home-gallery-preview").then((mod) => mod.HomeDrawerPreview),
    { loading: DemoFallback, ssr: false },
  ),
  ThemeDemo: dynamic(
    () => import("@/ui/home/home-gallery-preview").then((mod) => mod.HomeThemePreview),
    { loading: DemoFallback, ssr: false },
  ),
};
