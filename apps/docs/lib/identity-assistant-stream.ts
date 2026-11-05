import {
  consumeSseStream,
  readAssistantStreamEvent,
  type AssistantStreamStage,
} from "@zedtech/zedkit-ui";

import {
  ASSISTANT_URL,
  checkInput,
  readJson,
  requestIdentity,
  resultFromBody,
  resultFromStreamError,
  trimHistory,
  type AssistantInput,
  type AssistantResult,
  type FetchLike,
} from "./identity-assistant.ts";

export type StreamHandlers = {
  onStatus?: ((stage: AssistantStreamStage) => void) | undefined;
  onText?: ((draft: string) => void) | undefined;
};

function isEventStream(res: Response): boolean {
  return (res.headers.get("content-type") ?? "").includes("text/event-stream");
}

async function readStream(
  res: Response,
  requestId: string,
  signal: AbortSignal | undefined,
  handlers: StreamHandlers,
): Promise<AssistantResult> {
  let draft = "";
  let complete: Record<string, unknown> | null = null;
  let streamError: Record<string, unknown> | null = null;
  if (!res.body) return { kind: "network" };
  const consumed = await consumeSseStream(
    res.body,
    (frame) => {
      const event = readAssistantStreamEvent(frame);
      if (!event) return;
      if (event.type === "status") {
        handlers.onStatus?.(event.stage);
        return;
      }
      if (event.type === "text") {
        draft += event.delta;
        handlers.onText?.(draft);
        return;
      }
      if (event.type === "complete") {
        complete = event.payload;
        return;
      }
      streamError = event.payload;
    },
    signal,
  );
  if (complete) return resultFromBody(res, complete, requestId);
  if (streamError) return resultFromStreamError(streamError);
  if (consumed.ok) return { kind: "network" };
  if (signal?.aborted) return { kind: "aborted" };
  return { kind: "network" };
}

/**
 * Prefer an SSE response (status + text deltas + complete). If the server
 * answers JSON, reuse the existing parser. Retry a JSON POST only when the
 * stream request never got a response — never after bytes have already started,
 * so a dropped stream cannot charge twice.
 */
export function requestIdentityStream(
  input: AssistantInput,
  {
    fetchImpl = globalThis.fetch.bind(globalThis),
    signal,
    onStatus,
    onText,
  }: { fetchImpl?: FetchLike | undefined; signal?: AbortSignal | undefined } & StreamHandlers = {},
): Promise<AssistantResult> {
  const checked = checkInput(input);
  if (checked !== "ok") {
    return Promise.resolve({ kind: "invalid-input", field: checked === "too-many-references" ? "references" : "prompt" });
  }
  return fetchImpl(ASSISTANT_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    credentials: "same-origin",
    ...(signal ? { signal } : {}),
    body: JSON.stringify({
      requestId: input.requestId,
      prompt: input.prompt.trim(),
      history: trimHistory(input.history),
      references: input.references,
      current: input.current,
    }),
  })
    .then((res) =>
      isEventStream(res)
        ? readStream(res, input.requestId, signal, { onStatus, onText })
        : readJson(res).then((body) => resultFromBody(res, body, input.requestId)),
    )
    .catch((error: unknown) => {
      if ((error as { name?: string } | null)?.name === "AbortError") return { kind: "aborted" as const };
      return requestIdentity(input, { fetchImpl, signal });
    });
}

export type { AssistantStreamStage };
