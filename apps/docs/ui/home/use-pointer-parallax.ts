import { useEffect, type RefObject } from "react";

/**
 * Writes the pointer's place over an element as `--zk-px` and `--zk-py` (-1 at one edge, 1 at the other).
 * Decorative layers read them to drift a few pixels toward the cursor. Hover pointers only, one write per frame,
 * and the values go back to 0 when the pointer leaves.
 */
export function usePointerParallax(target: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const node = target.current;
    if (!enabled || !node || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    const write = (x: number, y: number) => {
      node.style.setProperty("--zk-px", x.toFixed(3));
      node.style.setProperty("--zk-py", y.toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        const x = ((event.clientX - box.left) / box.width) * 2 - 1;
        const y = ((event.clientY - box.top) / box.height) * 2 - 1;
        write(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      write(0, 0);
    };
    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [target, enabled]);
}
