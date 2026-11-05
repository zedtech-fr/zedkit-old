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

  // Focus goes back to the trigger only when the dock closes, never on mount: hydration lands late on the home
  // page, and a mount-time focus() takes the focus from whatever the visitor already reached.
  const wasExpanded = useRef(false);
  useEffect(() => {
    const closed = wasExpanded.current && !expanded;
    wasExpanded.current = expanded;
    if (!closed) return;
    const id = requestAnimationFrame(() => triggerRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [expanded]);

  return triggerRef;
}
