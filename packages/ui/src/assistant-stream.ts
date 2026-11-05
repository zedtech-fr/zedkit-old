import { tryCatch, tryCatchAsync, type Result } from "@zedtech/zedkit-core";

/** Named steps an assistant stream may announce while work is in progress. */
export const ASSISTANT_STREAM_STAGES = [
  "reading-reference",
  "picking-palette",
  "picking-typography",
  "picking-spacing",
  "building-preview",
] as const;

export type AssistantStreamStage = (typeof ASSISTANT_STREAM_STAGES)[number];

const STAGES = new Set<string>(ASSISTANT_STREAM_STAGES);

export function isAssistantStreamStage(value: string): value is AssistantStreamStage {
  return STAGES.has(value);
}

export type SseFrame = { event: string; data: string };

export type AssistantStreamEvent =
  | { type: "status"; stage: AssistantStreamStage }
  | { type: "text"; delta: string }
  | { type: "complete"; payload: Record<string, unknown> }
  | { type: "error"; error: string; payload: Record<string, unknown> };

function parseSsePart(part: string): SseFrame | null {
  let event = "message";
  const data: string[] = [];
  for (const raw of part.split("\n")) {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (line === "" || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      data.push(line.slice(5).startsWith(" ") ? line.slice(6) : line.slice(5));
    }
  }
  return data.length === 0 ? null : { event, data: data.join("\n") };
}

/** Complete SSE frames in `buffer`, leaving any trailing partial frame as `rest`. */
export function pullSseFrames(buffer: string): { frames: SseFrame[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const frames: SseFrame[] = [];
  for (const part of parts) {
    const frame = parseSsePart(part);
    if (frame) frames.push(frame);
  }
  return { frames, rest };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** One named assistant event from an SSE frame, or nothing if the frame is not one. */
export function readAssistantStreamEvent(frame: SseFrame): AssistantStreamEvent | null {
  const parsed = tryCatch(() => JSON.parse(frame.data) as unknown);
  const data = parsed.ok ? asRecord(parsed.value) : null;
  if (!data) return null;
  if (frame.event === "status") {
    const stage = typeof data.stage === "string" ? data.stage : "";
    return isAssistantStreamStage(stage) ? { type: "status", stage } : null;
  }
  if (frame.event === "text") {
    return typeof data.delta === "string" && data.delta.length > 0 ? { type: "text", delta: data.delta } : null;
  }
  if (frame.event === "complete") return { type: "complete", payload: data };
  if (frame.event === "error") {
    return { type: "error", error: typeof data.error === "string" && data.error ? data.error : "upstream", payload: data };
  }
  return null;
}

async function drainSse(reader: ReadableStreamDefaultReader<Uint8Array>, onFrame: (frame: SseFrame) => void): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const pulled = pullSseFrames(buffer);
    buffer = pulled.rest;
    for (const frame of pulled.frames) onFrame(frame);
  }
  if (buffer.trim() === "") return;
  const tail = pullSseFrames(`${buffer}\n\n`);
  for (const frame of tail.frames) onFrame(frame);
}

/**
 * Reads an SSE byte stream to the end, calling `onFrame` for each complete event.
 * Comments (keep-alives) are ignored. Errors from the reader become a failed Result.
 */
export function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  onFrame: (frame: SseFrame) => void,
  signal?: AbortSignal,
): Promise<Result<void, Error>> {
  const reader = stream.getReader();
  const onAbort = () => {
    void reader.cancel();
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  return tryCatchAsync(() => drainSse(reader, onFrame)).then((result: Result<void, Error>) => {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
    return result;
  });
}
