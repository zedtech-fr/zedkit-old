import { useEffect, useRef } from "react";

/** Within a step the example rests at the top, pans to its bottom, then rests there: the share of the step where it moves. */
const PAN_FROM = 0.1;
const PAN_TO = 0.8;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * A pinned stage has a fixed height, so an example can hold more than it shows. This marks it (`data-clipped`, while
 * there is more below, so a fade can say so) and, while the page scrolls through that example's step, pans the stage
 * down to reveal the rest: nothing is ever out of reach. Only a stage that clips (`overflow-y: hidden`, which the
 * pinned layout sets) is touched. A new example starts at the top, and a stage the visitor is working in stays put.
 */
export function useClippedStage(example: string) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const clips = () => getComputedStyle(node).overflowY === "hidden";
    const room = () => node.scrollHeight - node.clientHeight;
    const check = () => node.toggleAttribute("data-clipped", clips() && room() - node.scrollTop > 2);
    const pan = (event: Event) => {
      if (!clips() || room() <= 2 || node.contains(document.activeElement)) return;
      const slice = (event as CustomEvent<number>).detail;
      const along = Math.min(1, Math.max(0, (slice - PAN_FROM) / (PAN_TO - PAN_FROM)));
      node.scrollTop = room() * smooth(along);
      check();
    };
    const track = node.closest("[data-identity-track]");
    track?.addEventListener("pinned-slice", pan);
    node.addEventListener("scroll", check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    node.scrollTop = 0;
    check();
    return () => {
      track?.removeEventListener("pinned-slice", pan);
      node.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, [example]);
  return stage;
}
