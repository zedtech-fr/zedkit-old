import { useEffect, useRef } from "react";

/** Opens with Ctrl/Cmd+I; Escape closes and returns focus to the trigger (D2). */
export function useIdentityDockKeyboard(expanded: boolean, setExpanded: (open: boolean) => void) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i" && !typing) {
        event.preventDefault();
        setExpanded(true);
        return;
      }
      if (event.key === "Escape" && expanded) {
        event.preventDefault();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  useEffect(() => {
    if (expanded) return;
    const id = requestAnimationFrame(() => triggerRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [expanded]);

  return triggerRef;
}
