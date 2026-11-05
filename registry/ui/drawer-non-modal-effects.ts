import * as React from "react";

type NonModalDrawerFocusProps = {
  open: boolean;
  dismissible: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

function useNonModalDrawerEscape({ open, dismissible, onOpenChange }: NonModalDrawerFocusProps): void {
  React.useEffect(() => {
    if (!open || !dismissible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissible, onOpenChange, open]);
}

function useNonModalDrawerFocusRestore({ open, triggerRef }: NonModalDrawerFocusProps): void {
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    const trigger = triggerRef.current;
    if (trigger && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
  }, [open, triggerRef]);
}

export { useNonModalDrawerEscape, useNonModalDrawerFocusRestore };
