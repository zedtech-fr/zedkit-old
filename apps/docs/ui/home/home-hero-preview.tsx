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

/** The three examples, one grid cell: the frame keeps the height of the tallest, so the page below never moves. */
function HeroExamples({ preview, onPreview }: { preview: PreviewMode; onPreview: (mode: PreviewMode) => void }) {
  return (
    <>
      {homeCopy.heroExamples.map((item) => (
        <TabsContent
          key={item.id}
          value={item.id}
          forceMount
          // Inactive panels stay mounted (the table keeps its rows) but invisible, which also takes them out
          // of the tab order and the accessibility tree.
          className="col-start-1 row-start-1 mt-0 min-w-0 data-[state=inactive]:invisible"
          data-hero-example={item.id}
        >
          {item.id === "table" ? (
            <HomeAdminDashboardDemo
              label={homeCopy.heroPreview.demoLabel}
              preview={preview}
              onPreviewChange={onPreview}
              variant="home"
            />
          ) : item.id === "panel" ? (
            <HomeHeroDrawerScene />
          ) : (
            <HomeHeroCalendarScene />
          )}
        </TabsContent>
      ))}
    </>
  );
}

/**
 * Hero specimen: one frame, three examples chosen with real tabs.
 *
 * The frame (tabs above, Display row below) is site chrome. The ThemeScope between them is the
 * specimen: it wears the look chosen in the Display row and nothing from the page.
 */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [modePin, setModePin] = useState<HeroDemoModePin>("follow");
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const [example, setExample] = useState<HeroExampleId>("table");
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = resolveHeroDemoDark(modePin, mounted && resolvedTheme === "dark");

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
      <ThemeScope
        identity={look}
        mode={dark ? "dark" : "light"}
        className="grid min-h-0 min-w-0 bg-background"
        data-home-hero-visuals=""
      >
        <HeroExamples preview={preview} onPreview={setPreview} />
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
