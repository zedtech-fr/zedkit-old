import { useEffect, useRef, type RefObject } from "react";

/**
 * Fades a scope back in when its look changes, instead of snapping. Opacity only: nothing inside becomes the
 * containing block of a toast. Does nothing on the first render or without motion.
 */
export function useLookFade(scope: RefObject<HTMLElement | null>, look: string, motionOk: boolean) {
  const shown = useRef(look);
  useEffect(() => {
    if (shown.current === look) return;
    shown.current = look;
    if (motionOk) scope.current?.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 520, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
  }, [scope, look, motionOk]);
}
