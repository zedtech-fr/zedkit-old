"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ThemeScope, cn } from "@zedtech/zedkit-ui";
import { HeroDemoStyleControl } from "@/components/hero-demo-style-control";
import { HeroTourControl } from "@/components/hero-tour-control";
import type { PreviewMode } from "@/components/admin-dashboard-demo-app";
import { resolveHeroDemoDark, type HeroDemoModePin } from "@/components/hero-demo-style-fields";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { HomeHeroApp } from "@/ui/home/home-hero-app";
import { HomeHeroSatellites } from "@/ui/home/home-hero-satellites";
import { HOME_HERO_PREVIEW_SHELL_CLASS } from "@/ui/home/home-rhythm";
import type { HeroPageId } from "@/ui/home/i18n/home-hero-copy";
import { useLookFade } from "@/ui/home/use-look-fade";
import { usePointerParallax } from "@/ui/home/use-pointer-parallax";
import { useHeroTourState } from "@/ui/home/use-hero-tour";
import { useMotionOk } from "@/ui/home/use-motion-ok";

const noop = () => () => {};

/** How long the first assembly of the window lasts; after it, changing page is quicker. */
const INTRO_MS = 1800;

/** True for the first moments after load, while the window assembles. */
function useIntro(): boolean {
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIntro(false), INTRO_MS);
    return () => clearTimeout(timer);
  }, []);
  return intro;
}

/** The Display row under the window and, when there is a tour to control, its Pause / Play button. */
function HeroPreviewFooter({
  look,
  modePin,
  preview,
  showPreview,
  onLook,
  onModePin,
  onPreview,
  tour,
}: {
  look: string;
  modePin: HeroDemoModePin;
  preview: PreviewMode;
  showPreview: boolean;
  onLook: (id: string) => void;
  onModePin: (pin: HeroDemoModePin) => void;
  onPreview: (mode: string) => void;
  tour: { playing: boolean; onToggle: () => void } | null;
}) {
  return (
    <div
      className="flex flex-col gap-2 border-t border-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-4"
      data-home-specimen-footer=""
    >
      <HeroDemoStyleControl
        look={look}
        modePin={modePin}
        preview={preview}
        showPreview={showPreview}
        onLook={onLook}
        onModePin={onModePin}
        onPreview={onPreview}
      />
      {tour ? <HeroTourControl playing={tour.playing} onToggle={tour.onToggle} /> : null}
    </div>
  );
}

/**
 * Hero specimen: one small product the visitor can use, in a frame with a Display row under it.
 *
 * The frame (and the Display row) is site chrome. The ThemeScope is the specimen: the window and the cards around it
 * wear the look chosen in the Display row and nothing from the page. The window's pages are the examples (see
 * `home-hero-app.tsx`); the Table state select only appears while the Apps page, the one with a table, is on show.
 */
export function HomeHeroPreview() {
  const [look, setLook] = useState(DEFAULT_IDENTITY);
  const [modePin, setModePin] = useState<HeroDemoModePin>("follow");
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const [page, setPage] = useState<HeroPageId>("overview");
  const intro = useIntro();
  const frame = useRef<HTMLDivElement>(null);
  const scope = useRef<HTMLDivElement>(null);
  const motionOk = useMotionOk();
  const tour = useHeroTourState(motionOk);
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const dark = resolveHeroDemoDark(modePin, mounted && resolvedTheme === "dark");

  usePointerParallax(frame, motionOk);
  useLookFade(scope, look, motionOk);

  return (
    <div
      ref={frame}
      id="demo"
      data-home-hero-proof
      data-home-hero-preview
      data-home-dashboard-card
      data-home-specimen-stage=""
      className={cn(
        HOME_HERO_PREVIEW_SHELL_CLASS,
        "relative flex max-w-full min-w-0 scroll-mt-24 flex-col rounded-xl border border-border bg-card",
      )}
    >
      <ThemeScope
        ref={scope}
        identity={look}
        mode={dark ? "dark" : "light"}
        className="relative min-h-0 min-w-0 rounded-t-xl bg-background"
        data-home-hero-visuals=""
      >
        <HomeHeroApp
          page={page}
          onPage={setPage}
          intro={intro}
          preview={preview}
          onPreviewChange={setPreview}
          onLook={setLook}
          tour={{ available: tour.available, playing: tour.playing, onTakeover: tour.takeover }}
        />
        <HomeHeroSatellites />
      </ThemeScope>
      <HeroPreviewFooter
        look={look}
        modePin={modePin}
        preview={preview}
        showPreview={page === "apps"}
        onLook={setLook}
        onModePin={setModePin}
        onPreview={(value) => setPreview(value as PreviewMode)}
        tour={tour.available ? { playing: tour.playing, onToggle: tour.toggle } : null}
      />
    </div>
  );
}
