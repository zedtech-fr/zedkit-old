"use client";

import { useCallback, useEffect, useRef, type Dispatch, type RefObject } from "react";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

import type { AssistantStatus } from "@/lib/identity-assistant";
import { newRequestId } from "@/lib/identity-request-id";
import type { SessionAction, SessionState } from "@/lib/identity-creator-session";

/** Paid generation and cancel; lives outside the provider to keep the provider under the line cap. */
export function useAssistantNetwork(
  dispatch: Dispatch<SessionAction>,
  setStatus: (status: AssistantStatus | null) => void,
  live: RefObject<{ thread: SessionState["thread"] }>,
) {
  const controller = useRef<AbortController | null>(null);
  const inflight = useRef(false);

  useEffect(() => () => controller.current?.abort(), []);

  const submit = useCallback(
    (prompt: string, references: readonly string[], current: IdentityTokens) => {
      if (inflight.current) return;
      inflight.current = true;
      const requestId = newRequestId();
      const abort = new AbortController();
      controller.current = abort;
      dispatch({ type: "submit", requestId, prompt });
      const history = live.current.thread;
      // The request code loads on first submit; it stays out of every page's first load.
      void import("@/lib/identity-assistant-stream")
        .then(({ requestIdentityStream }) =>
          requestIdentityStream(
            { requestId, prompt, references, history, current },
            {
              signal: abort.signal,
              onStatus: (stage) => dispatch({ type: "stream-status", requestId, stage }),
              onText: (draft) => dispatch({ type: "stream-text", requestId, draft }),
            },
          ),
        )
        .then((result) => {
          if (controller.current === abort) inflight.current = false;
          if (result.kind === "unavailable") setStatus({ available: false, reason: result.reason });
          dispatch({ type: "result", requestId, result });
        });
    },
    [dispatch, live, setStatus],
  );

  const cancel = useCallback(() => {
    controller.current?.abort();
    inflight.current = false;
    dispatch({ type: "cancel" });
  }, [dispatch]);

  return { submit, cancel };
}
