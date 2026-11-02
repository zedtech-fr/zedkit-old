"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, ThemeScope, cn } from "@zedtech/zedkit-ui";
import { HeroDemoStyleControl } from "@/components/hero-demo-style-control";
import type { PreviewMode } from "@/components/admin-dashboard-demo-app";
import {
  resolveHeroDemoDark,
  type HeroDemoModePin,
} from "@/components/hero-demo-style-fields";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";
import { HomeHeroCalendarScene, HomeHeroDrawerScene } from "@/ui/home/home-hero-scene-visuals";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import type { HeroExampleId } from "@/ui/home/i18n/home-hero-copy";

const HomeAdminDashboardDemo = dynamic(
  () => import("@/components/demos/home-admin-dashboard-demo").then((mod) => mod.HomeAdminDashboardDemo),
  { loading: () => <Stack className="min-h-32 flex-1" aria-hidden="true" /> },
);

const noop = () => () => {};

function isExample(value: string): value is HeroExampleId {
  return homeCopy.heroExamples.some((example) => example.id === value);
}

/** The row of real tabs above the specimen: site chrome, not part of the specimen's look. */
function HeroExampleToolbar() {
  return (
    <div className="border-b border-border px-3 py-2.5 sm:px-4" data-home-specimen-toolbar="">
      <TabsList
        aria-label={homeCopy.heroPreview.examplesAriaLabel}
        className="grid h-auto! min-h-11 w-full grid-cols-3 gap-1 sm:inline-grid sm:w-auto"
        data-home-hero-examples=""
      >
        {homeCopy.heroExamples.map((item) => (
          <TabsTrigger key={item.id} value={item.id} className="min-h-9 px-2 sm:px-4">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

function HeroExampleVisual({
  id,
  preview,
  onPreviewChange,
}: {
  id: HeroExampleId;
  preview: PreviewMode;
  onPreviewChange: (value: PreviewMode) => void;
}) {
  if (id === "table") {
    return (
      <HomeAdminDashboardDemo
        label={homeCopy.heroPreview.demoLabel}
        preview={preview}
        onPreviewChange={onPreviewChange}
        variant="home"
      />
    );
  }
  return id === "panel" ? <HomeHeroDrawerScene /> : <HomeHeroCalendarScene />;
}

/**
 * Hero specimen: one frame, three examples chosen with real tabs.
 *
 * The frame (tabs above, Display row below) is site chrome. The ThemeScope between them is the
 * specimen: it wears the look chosen in the Display row and nothing from the page. The panels
 * share one grid cell, so the frame keeps the height of the tallest example and the page below
 * does not move when the example changes; every panel stays mounted, so rows added in the table
 * are still there when the visitor comes back to it.
 */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [modePin, setModePin] = useState<HeroDemoModePin>("follow");
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const [example, setExample] = useState<HeroExampleId>("table");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const siteDark = mounted && resolvedTheme === "dark";
  const dark = resolveHeroDemoDark(modePin, siteDark);

  return (
    <Tabs
      value={example}
      onValueChange={(value) => {
        if (isExample(value)) setExample(value);
      }}
      id="demo"
      data-home-hero-proof
      data-home-hero-preview
      data-home-dashboard-card
      data-home-specimen-stage=""
      className={cn(
        HOME_HERO_PREVIEW_SHELL_CLASS,
        "flex max-w-full min-w-0 scroll-mt-24 flex-col rounded-xl border border-border bg-card",
      )}
    >
      <HeroExampleToolbar />
      <ThemeScope
        identity={look}
        mode={dark ? "dark" : "light"}
        className="grid min-h-0 min-w-0 bg-background"
        data-home-hero-visuals=""
      >
        {homeCopy.heroExamples.map((item) => (
          <TabsContent
            key={item.id}
            value={item.id}
            forceMount
            // One grid cell: the frame is as tall as the tallest example. Inactive panels are invisible,
            // which also takes them out of the tab order and the accessibility tree.
            className="col-start-1 row-start-1 mt-0 min-w-0 data-[state=inactive]:invisible"
            data-hero-example={item.id}
          >
            <HeroExampleVisual id={item.id} preview={preview} onPreviewChange={setPreview} />
          </TabsContent>
        ))}
      </ThemeScope>
      <div className="border-t border-border px-3 py-2.5 sm:px-4" data-home-specimen-footer="">
        <HeroDemoStyleControl
          look={look}
          modePin={modePin}
          preview={preview}
          showPreview={example === "table"}
          onLook={setLook}
          onModePin={setModePin}
          onPreview={(value) => setPreview(value as PreviewMode)}
        />
      </div>
    </Tabs>
  );
}
