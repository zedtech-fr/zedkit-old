"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@zedtech/zedkit-ui";
import { TOUR_CONTROL_ATTRIBUTE } from "@/ui/home/use-hero-tour";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroTour;

/**
 * Pauses the guided tour, or plays it again from the first page. The tour never restarts by itself: playing
 * it again is always this press. Pressing it is not a takeover of the example (see `use-hero-tour.ts`).
 */
export function HeroTourControl({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  const control = { [TOUR_CONTROL_ATTRIBUTE]: "" };
  return (
    <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={onToggle} {...control}>
      {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
      {playing ? copy.pause : copy.play}
    </Button>
  );
}
