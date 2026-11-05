"use client";

import dynamic from "next/dynamic";
import { MousePointer2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Stack } from "@zedtech/zedkit-ui";
import type { PreviewMode } from "@/components/admin-dashboard-demo-app";
import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";
import { SEED_TASKS } from "@/components/project-tracker-demo-data";
import { HERO_FIRST_DAY } from "@/ui/home/home-hero-data";
import { HeroCalendarPage } from "@/ui/home/home-hero-calendar";
import { HeroOverviewPage } from "@/ui/home/home-hero-overview";
import { HeroSettingsPage } from "@/ui/home/home-hero-settings";
import { HeroShell, HeroSidebar, HeroTopBar } from "@/ui/home/home-hero-shell-parts";
import { HeroTeamPage } from "@/ui/home/home-hero-team";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import type { HeroPageId } from "@/ui/home/i18n/home-hero-copy";
import { useHeroAgent } from "@/ui/home/use-hero-agent";
import { useHeroTour } from "@/ui/home/use-hero-tour";
import { useMotionOk } from "@/ui/home/use-motion-ok";

const loadHomeAdminDashboardDemo = () =>
  import("@/components/demos/registry").then((mod) => ({ default: mod.demoRegistry.HomeAdminDashboardDemo.Demo }));

const HomeAdminDashboardDemo = dynamic(loadHomeAdminDashboardDemo, {
  loading: () => <Stack className="min-h-96 w-full min-w-0 flex-1" aria-hidden="true" />,
});

/** The agent panel is its own chunk: fetched when the tour is about to use it or the visitor first opens it. */
const loadAgentPanel = () => import("@/ui/home/home-hero-agent-panel");
const HeroAgentPanel = dynamic(loadAgentPanel);

const copy = homeCopy.heroApp;

type AppProps = {
  page: HeroPageId;
  onPage: (id: HeroPageId) => void;
  /** True for the first moments after load: the pages assemble a little later than on later visits. */
  intro: boolean;
  preview: PreviewMode;
  onPreviewChange: (mode: PreviewMode) => void;
  /** The tour changes the look through this, the way the Display row does. */
  onLook: (id: string) => void;
  /** Whether the guided tour runs, and what to do when the visitor takes the example over. */
  tour: { available: boolean; playing: boolean; onTakeover: () => void };
};

/** One page. All five stay mounted in a single grid cell: the window is as tall as the tallest, and what the visitor did stays. */
function Page({ id, page, children }: { id: HeroPageId; page: HeroPageId; children: React.ReactNode }) {
  return (
    <section
      data-hero-page={id}
      data-state={id === page ? "active" : "inactive"}
      className="col-start-1 row-start-1 min-w-0 data-[state=inactive]:invisible"
    >
      {children}
    </section>
  );
}

function Pages({ page, preview, onPreviewChange, motionOk }: Pick<AppProps, "page" | "preview" | "onPreviewChange"> & { motionOk: boolean }) {
  const [day, setDay] = useState<Date | undefined>(HERO_FIRST_DAY);
  const [person, setPerson] = useState<string>(projectTrackerDemoCopy.people.maya);
  return (
    <div className="grid min-w-0">
      <Page id="overview" page={page}>
        <HeroOverviewPage rows={SEED_TASKS} active={motionOk && page === "overview"} />
      </Page>
      <Page id="apps" page={page}>
        <HomeAdminDashboardDemo label={copy.appsLabel} preview={preview} onPreviewChange={onPreviewChange} variant="home" />
      </Page>
      <Page id="calendar" page={page}>
        <HeroCalendarPage rows={SEED_TASKS} day={day} onDay={setDay} />
      </Page>
      <Page id="team" page={page}>
        <HeroTeamPage rows={SEED_TASKS} selected={person} onSelect={setPerson} />
      </Page>
      <Page id="settings" page={page}>
        <HeroSettingsPage />
      </Page>
    </div>
  );
}

/**
 * The hero's example: one small product built from kit components. Its pages are the samples.
 * Until the visitor touches the frame, a cursor tours the pages and uses real controls (`use-hero-tour.ts`).
 */
export function HomeHeroApp({ page, onPage, intro, preview, onPreviewChange, onLook, tour }: AppProps) {
  const motionOk = useMotionOk();
  const root = useRef<HTMLDivElement>(null);
  const agent = useHeroAgent();
  const panelId = useId();
  useHeroTour({
    rootRef: root,
    enabled: tour.available,
    playing: tour.playing,
    onTakeover: tour.onTakeover,
    onLook,
    intro,
    agent: {
      preload: () => {
        void loadHomeAdminDashboardDemo();
        void loadAgentPanel();
      },
      reset: agent.reset,
      paste: (text) => flushSync(() => agent.setDraft(text)),
    },
  });
  return (
    <div ref={root} role="region" aria-label={copy.label} data-hero-window="" data-intro={intro ? "" : undefined} className="relative min-w-0">
      <HeroShell sidebar={<HeroSidebar page={page} onPage={onPage} />} topbar={<HeroTopBar page={page} onPage={onPage} agent={{ open: agent.open, panelId, onToggle: agent.toggle }} />}>
        <Pages page={page} preview={preview} onPreviewChange={onPreviewChange} motionOk={motionOk} />
      </HeroShell>
      {agent.open ? (
        <HeroAgentPanel
          id={panelId}
          draft={agent.draft}
          status={agent.status}
          step={agent.step}
          onDraft={agent.setDraft}
          onSubmit={agent.submit}
          onClose={agent.toggle}
        />
      ) : null}
      <span data-hero-cursor="" aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-30 text-foreground">
        <MousePointer2 className="size-5 fill-foreground text-background" />
      </span>
    </div>
  );
}
