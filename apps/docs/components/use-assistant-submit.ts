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
  /** When the composer was cleared after a proposal landed, a second send still uses that prompt. */
  resendPrompt?: string,
) {
  const send = useCallback(() => {
    const prompt = brief.trim() || resendPrompt?.trim() || "";
    const references = linksInText(prompt).urls;
    if (checkInput({ prompt, references }) !== "ok") return;
    submit(prompt, references);
    // The request now reads as a message in the conversation, so the composer empties like any chat.
    clearBrief?.();
  }, [brief, resendPrompt, submit, clearBrief]);

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
