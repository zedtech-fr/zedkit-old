import { describe, expect, it } from "vitest";

import {
  consumeSseStream,
  isAssistantStreamStage,
  pullSseFrames,
  readAssistantStreamEvent,
} from "#index.js";

describe("pullSseFrames", () => {
  it("splits complete frames and leaves a partial rest", () => {
    const { frames, rest } = pullSseFrames(
      'event: status\ndata: {"stage":"reading-reference"}\n\nevent: text\ndata: {"delta":"Hel',
    );
    expect(frames).toEqual([{ event: "status", data: '{"stage":"reading-reference"}' }]);
    expect(rest).toBe('event: text\ndata: {"delta":"Hel');
  });

  it("ignores comment keep-alives", () => {
    const { frames } = pullSseFrames(': keepalive\n\nevent: text\ndata: {"delta":"Hi"}\n\n');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
  });
});

describe("readAssistantStreamEvent", () => {
  it("reads each named event and drops unknown stages", () => {
    expect(readAssistantStreamEvent({ event: "status", data: '{"stage":"picking-palette"}' })).toEqual({
      type: "status",
      stage: "picking-palette",
    });
    expect(readAssistantStreamEvent({ event: "text", data: '{"delta":"Quiet "}' })).toEqual({
      type: "text",
      delta: "Quiet ",
    });
    expect(readAssistantStreamEvent({ event: "complete", data: '{"summary":"Done."}' })).toEqual({
      type: "complete",
      payload: { summary: "Done." },
    });
    expect(readAssistantStreamEvent({ event: "error", data: '{"error":"timeout"}' })).toEqual({
      type: "error",
      error: "timeout",
      payload: { error: "timeout" },
    });
    expect(readAssistantStreamEvent({ event: "status", data: '{"stage":"nope"}' })).toBeNull();
    expect(isAssistantStreamStage("building-preview")).toBe(true);
    expect(isAssistantStreamStage("writing")).toBe(false);
  });
});

describe("consumeSseStream", () => {
  it("delivers frames as bytes arrive", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('event: status\ndata: {"stage":"reading-reference"}\n\n'));
        controller.enqueue(enc.encode('event: text\ndata: {"delta":"From "}\n\n: keepalive\n\n'));
        controller.enqueue(enc.encode('event: complete\ndata: {"summary":"From the site."}\n\n'));
        controller.close();
      },
    });
    const events = [] as ReturnType<typeof readAssistantStreamEvent>[];
    const result = await consumeSseStream(stream, (frame) => {
      events.push(readAssistantStreamEvent(frame));
    });
    expect(result.ok).toBe(true);
    expect(events).toEqual([
      { type: "status", stage: "reading-reference" },
      { type: "text", delta: "From " },
      { type: "complete", payload: { summary: "From the site." } },
    ]);
  });
});
