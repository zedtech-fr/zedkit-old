import { useCallback } from "react";

import { checkInput } from "@/lib/identity-assistant";
import { linksInText } from "@/lib/identity-links-in-text";

/** Shared send and one-click refine handlers for the dock and the editor assistant. */
export function useAssistantSubmitHandlers(
  brief: string,
  submit: (prompt: string, references: readonly string[]) => void,
  busy: boolean,
  off: boolean,
  clearBrief?: () => void,
) {
  const send = useCallback(() => {
    const references = linksInText(brief).urls;
    if (checkInput({ prompt: brief, references }) !== "ok") return;
    submit(brief, references);
    // The request now reads as a message in the conversation, so the composer empties like any chat.
    clearBrief?.();
  }, [brief, submit, clearBrief]);

  const quickRefine = useCallback(
    (prompt: string) => {
      if (off || busy) return;
      if (checkInput({ prompt, references: [] }) !== "ok") return;
      submit(prompt, []);
    },
    [busy, off, submit],
  );

  return { send, quickRefine };
}
