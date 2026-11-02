import { useCallback, useEffect, useRef } from "react";

/**
 * Lets scroll position choose one of `count` steps while a sticky pin is stuck inside a tall track.
 *
 * The track is as tall as the pin plus `count` steps of scroll; the pin is `position: sticky` (see
 * `home-identity-scroll.css`). The browser keeps scrolling natively: this only reads where the track is and reports
 * which step the scroll is in, writes the overall progress to `--zk-progress` on the track, and dispatches
 * `pinned-slice` on it (detail: how far through the current step, 0 to 1) for anything that follows the step.
 *
 * Where the pin is not sticky (phones, short windows, reduced motion) nothing is read or reported, so the steps
 * stay whatever the visitor picked.
 */
export function usePinnedSteps({ count, onStep }: { count: number; onStep: (step: number) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);

  /** Where the track is, as progress through the stuck stretch (0 when the pin sticks, 1 when it lets go). Null if not pinned. */
  const read = useCallback(() => {
    const trackNode = track.current;
    const pinNode = pin.current;
    if (!trackNode || !pinNode) return null;
    const style = getComputedStyle(pinNode);
    if (style.position !== "sticky") return null;
    const distance = trackNode.getBoundingClientRect().height - pinNode.offsetHeight;
    if (distance <= 0) return null;
    const stuckAt = Number.parseFloat(style.top) || 0;
    return { distance, stuckAt, top: trackNode.getBoundingClientRect().top };
  }, []);

  useEffect(() => {
    const trackNode = track.current;
    if (!trackNode) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const place = read();
      if (!place) {
        trackNode.style.removeProperty("--zk-progress");
        return;
      }
      const progress = (place.stuckAt - place.top) / place.distance;
      trackNode.style.setProperty("--zk-progress", String(Math.min(1, Math.max(0, progress))));
      if (progress < 0 || progress > 1) return;
      const scaled = progress * count;
      const step = Math.min(count - 1, Math.floor(scaled));
      onStep(step);
      trackNode.dispatchEvent(new CustomEvent("pinned-slice", { detail: Math.min(1, scaled - step) }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [count, onStep, read]);

  /** Scrolls to the start of a step's stretch (just inside it), but only while the pin is stuck: otherwise the page stays put. */
  const goTo = useCallback(
    (step: number) => {
      const place = read();
      if (!place) return;
      const progress = (place.stuckAt - place.top) / place.distance;
      if (progress < 0 || progress > 1) return;
      window.scrollTo({
        top: window.scrollY + place.top - place.stuckAt + ((step + 0.12) / count) * place.distance,
        behavior: "instant",
      });
    },
    [count, read],
  );

  return { track, pin, goTo };
}
