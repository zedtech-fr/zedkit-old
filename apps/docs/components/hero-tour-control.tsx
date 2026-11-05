"use client";

import { useRef } from "react";
import { Pause, Play } from "lucide-react";
import { Button, Text } from "@zedtech/zedkit-ui";
import { TOUR_CONTROL_ATTRIBUTE } from "@/ui/home/use-hero-tour";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroTour;

/**
 * Pauses the guided tour, or plays it again from the first page. The tour never restarts by itself: playing
 * it again is always this press. Pressing it is not a takeover of the example (see `use-hero-tour.ts`).
 */
export function HeroTourControl({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const control = { [TOUR_CONTROL_ATTRIBUTE]: "" };
  const label = playing ? copy.pause : copy.play;
  const toggle = () => {
    onToggle();
    ref.current?.focus({ preventScroll: true });
  };
  // Below xl the row under the example is full (the Apps page has a third select): the icon stays, the words stay for
  // assistive technology and as a tooltip, so the footer never wraps and the frame never changes height.
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="sm"
      className="w-fit"
      title={label}
      aria-label={label}
      onClick={toggle}
      {...control}
    >
      {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
      <Text as="span" className="sr-only xl:not-sr-only">
        {label}
      </Text>
    </Button>
  );
}
