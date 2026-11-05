"use client";

import * as React from "react";
import { useNonModalDrawerEscape, useNonModalDrawerFocusRestore } from "./drawer-non-modal-effects.js";

type DrawerDirection = "top" | "right" | "bottom" | "left";

type NonModalDrawerContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: DrawerDirection;
  dismissible: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  titleId: string;
  descriptionId: string;
  titlePresent: boolean;
  setTitlePresent: (present: boolean) => void;
  descriptionPresent: boolean;
  setDescriptionPresent: (present: boolean) => void;
};

const NonModalDrawerContext = React.createContext<NonModalDrawerContextValue | null>(null);

function useNonModalDrawer(): NonModalDrawerContextValue {
  const ctx = React.useContext(NonModalDrawerContext);
  if (!ctx) {
    throw new Error("Drawer non-modal parts must be used within <Drawer modal={false}>.");
  }
  return ctx;
}

function useMaybeNonModalDrawer(): NonModalDrawerContextValue | null {
  return React.useContext(NonModalDrawerContext);
}

function NonModalDrawerProvider({
  open,
  onOpenChange,
  direction,
  dismissible,
  triggerRef,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: DrawerDirection;
  dismissible: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [titlePresent, setTitlePresent] = React.useState(false);
  const [descriptionPresent, setDescriptionPresent] = React.useState(false);
  const focusProps = { open, dismissible, onOpenChange, triggerRef };
  useNonModalDrawerEscape(focusProps);
  useNonModalDrawerFocusRestore(focusProps);
  const value = React.useMemo(
    () => ({
      open,
      onOpenChange,
      direction,
      dismissible,
      triggerRef,
      titleId,
      descriptionId,
      titlePresent,
      setTitlePresent,
      descriptionPresent,
      setDescriptionPresent,
    }),
    [
      descriptionPresent,
      descriptionId,
      direction,
      dismissible,
      onOpenChange,
      open,
      titleId,
      titlePresent,
      triggerRef,
    ],
  );
  return <NonModalDrawerContext.Provider value={value}>{children}</NonModalDrawerContext.Provider>;
}

export {
  NonModalDrawerProvider,
  useMaybeNonModalDrawer,
  useNonModalDrawer,
};
export type { DrawerDirection, NonModalDrawerContextValue };
