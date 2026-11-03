import { useCallback, useEffect, useRef } from "react";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";

/**
 * The assistant conversation and service status, shared by the floating dock and the editor page.
 * Generation starts only inside `submit`, called from a deliberate press.
 */
export function useIdentityAssistant(current: IdentityTokens, _opened: boolean) {
  const { session, dispatch, status, submit: storeSubmit, cancel } = useIdentityAssistantStore();
  const live = useRef({ current, thread: session.thread });

  useEffect(() => {
    live.current = { current, thread: session.thread };
  });

  const submit = useCallback(
    (prompt: string, references: readonly string[]) => {
      storeSubmit(prompt, references, live.current.current);
    },
    [storeSubmit],
  );

  return { session, status, dispatch, submit, cancel };
}
