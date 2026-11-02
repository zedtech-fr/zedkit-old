import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

import { fetchAssistantStatus, newRequestId, requestIdentity, type AssistantStatus } from "@/lib/identity-assistant";
import { initialSession, sessionReducer } from "@/lib/identity-creator-session";

/**
 * The assistant for one editor: the conversation (`sessionReducer`), whether the service is on (a free status
 * call, made once, and only once the visitor has opened the assistant: a page that merely shows the editor asks
 * nothing of the network), and the two things a visitor can do: send a brief, or cancel it. Generation happens only
 * inside `submit`, which is only called by a deliberate press. Typing, focus, scrolling and mounting never reach it.
 */
export function useIdentityAssistant(current: IdentityTokens, opened: boolean) {
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const live = useRef({ current, thread: session.thread });
  const controller = useRef<AbortController | null>(null);
  /** Set at once, before React re-renders: two presses in one tick are still one request. */
  const inflight = useRef(false);

  useEffect(() => {
    live.current = { current, thread: session.thread };
  });

  useEffect(() => {
    if (!opened) return;
    const stop = new AbortController();
    void fetchAssistantStatus({ signal: stop.signal }).then(setStatus);
    return () => stop.abort();
  }, [opened]);

  useEffect(() => () => controller.current?.abort(), []);

  const submit = useCallback((prompt: string, references: readonly string[]) => {
    if (inflight.current) return;
    inflight.current = true;
    const requestId = newRequestId();
    const abort = new AbortController();
    controller.current = abort;
    dispatch({ type: "submit", requestId, prompt });
    void requestIdentity(
      { requestId, prompt, references, history: live.current.thread, current: live.current.current },
      { signal: abort.signal },
    ).then((result) => {
      // An answer to a request the visitor cancelled is dropped by the reducer; this only frees the next press.
      if (controller.current === abort) inflight.current = false;
      if (result.kind === "unavailable") setStatus({ available: false, reason: result.reason });
      dispatch({ type: "result", requestId, result });
    });
  }, []);

  const cancel = useCallback(() => {
    controller.current?.abort();
    inflight.current = false;
    dispatch({ type: "cancel" });
  }, []);

  return { session, status, dispatch, submit, cancel };
}
