import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

import { requestIdentityStream } from "../lib/identity-assistant-stream.ts";
import { ASSISTANT_URL } from "../lib/identity-assistant.ts";

const CURRENT = identityPresets.mist;
const input = (over = {}) => ({ requestId: "request-0001", prompt: "A quiet studio for ceramics", history: [], references: [], current: CURRENT, ...over });
const json = (status, body, headers = {}) => ({
  status,
  ok: status < 300,
  headers: new globalThis.Headers(headers),
  text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
});

function streamResponse(text) {
  const bytes = new globalThis.TextEncoder().encode(text);
  return {
    status: 200,
    ok: true,
    headers: new globalThis.Headers({ "content-type": "text/event-stream" }),
    body: new globalThis.ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
    text: () => Promise.resolve(text),
  };
}

test("an event-stream answer yields status, text, then the same ok result", async () => {
  const complete = {
    requestId: "request-0001",
    summary: "From the site.",
    tokens: identityPresets.press,
    changed: ["radius"],
    references: [],
  };
  const body = [
    'event: status\ndata: {"stage":"reading-reference"}\n\n',
    'event: text\ndata: {"delta":"From the site."}\n\n',
    `event: complete\ndata: ${JSON.stringify(complete)}\n\n`,
  ].join("");
  const calls = [];
  const progress = [];
  const fetchImpl = (url, init) => {
    calls.push({ url, accept: init.headers.accept });
    return Promise.resolve(streamResponse(body));
  };
  const out = await requestIdentityStream(input(), {
    fetchImpl,
    onStatus: (stage) => progress.push(stage),
    onText: (draft) => progress.push(draft),
  });
  assert.equal(out.kind, "ok");
  assert.equal(out.summary, "From the site.");
  assert.deepEqual(out.changed, ["radius"]);
  assert.deepEqual(progress, ["reading-reference", "From the site."]);
  assert.equal(calls[0].url, ASSISTANT_URL);
  assert.equal(calls[0].accept, "text/event-stream");
});

test("a JSON response to the stream request is parsed the same as a direct JSON POST", async () => {
  const fetchImpl = () => Promise.resolve(json(200, { requestId: "request-0001", summary: "Rounder.", tokens: identityPresets.press, changed: ["radius"], references: [] }));
  const out = await requestIdentityStream(input(), { fetchImpl });
  assert.equal(out.kind, "ok");
  assert.equal(out.summary, "Rounder.");
});

test("a network failure before any response falls back to a JSON POST once", async () => {
  let n = 0;
  const fetchImpl = () => {
    n += 1;
    if (n === 1) return Promise.reject(new TypeError("fetch failed"));
    return Promise.resolve(json(200, { requestId: "request-0001", summary: "Rounder.", tokens: identityPresets.press, changed: [], references: [] }));
  };
  const out = await requestIdentityStream(input(), { fetchImpl });
  assert.equal(out.kind, "ok");
  assert.equal(n, 2);
});

test("a stream that dies after starting does not retry", async () => {
  let n = 0;
  const fetchImpl = () => {
    n += 1;
    return Promise.resolve({
      status: 200,
      ok: true,
      headers: new globalThis.Headers({ "content-type": "text/event-stream" }),
      body: new globalThis.ReadableStream({
        start(controller) {
          controller.enqueue(new globalThis.TextEncoder().encode('event: status\ndata: {"stage":"picking-palette"}\n\n'));
          controller.error(new Error("cut"));
        },
      }),
    });
  };
  const out = await requestIdentityStream(input(), { fetchImpl });
  assert.equal(out.kind, "network");
  assert.equal(n, 1);
});

test("a stream error event is a named failure, not a second paid call", async () => {
  let n = 0;
  const fetchImpl = () => {
    n += 1;
    return Promise.resolve(streamResponse('event: error\ndata: {"error":"timeout","references":[]}\n\n'));
  };
  const out = await requestIdentityStream(input(), { fetchImpl });
  assert.deepEqual(out, { kind: "timeout", references: [] });
  assert.equal(n, 1);
});
