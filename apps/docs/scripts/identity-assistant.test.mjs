import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

import { ASSISTANT_URL, checkInput, fetchAssistantStatus, newRequestId, requestIdentity, trimHistory } from "../lib/identity-assistant.ts";

const CURRENT = identityPresets.mist;
const input = (over = {}) => ({ requestId: "request-0001", prompt: "A quiet studio for ceramics", history: [], references: [], current: CURRENT, ...over });
const json = (status, body, headers = {}) => ({ status, ok: status < 300, headers: new globalThis.Headers(headers), text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)) });
const sends = (reply) => {
  const calls = [];
  const fetchImpl = (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : undefined });
    return Promise.resolve(typeof reply === "function" ? reply(calls.length) : reply);
  };
  return { fetchImpl, calls };
};

test("an ok answer is a whole identity the shared schema accepts, with its report", async () => {
  const { fetchImpl, calls } = sends(json(200, { requestId: "request-0001", summary: "Rounder.", tokens: identityPresets.press, changed: ["radius"], references: [{ url: "https://a.example.org/", status: "used", analysis: "text-only", host: "a.example.org", title: "A", chars: 120 }, { url: "https://b.example.org/", status: "failed", reason: "status-404" }] }));
  const out = await requestIdentity(input({ references: ["https://a.example.org/", "https://b.example.org/"] }), { fetchImpl });
  assert.equal(out.kind, "ok");
  assert.deepEqual(out.tokens, identityPresets.press);
  assert.deepEqual(out.changed, ["radius"]);
  assert.deepEqual(out.references.map((ref) => [ref.status, ref.analysis]), [["used", "text-only"], ["failed", undefined]]);
  assert.equal(calls[0].url, ASSISTANT_URL);
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["current", "history", "prompt", "references", "requestId"]);
  assert.equal(calls[0].init.credentials, "same-origin");
});

test("nothing partial or invalid is ever handed back as an identity", async () => {
  for (const tokens of [undefined, null, {}, { ...identityPresets.mist, radius: "}" }, { ...identityPresets.mist, light: { background: "red" } }, "x"]) {
    const out = await requestIdentity(input(), { fetchImpl: sends(json(200, { summary: "x", tokens })).fetchImpl });
    assert.equal(out.kind, "invalid-output", JSON.stringify(tokens));
  }
  assert.equal((await requestIdentity(input(), { fetchImpl: sends(json(200, "not json")).fetchImpl })).kind, "invalid-output");
});

test("each refusal is its own named outcome, with a retry time when there is one", async () => {
  const kinds = async (status, body, headers) => requestIdentity(input(), { fetchImpl: sends(json(status, body, headers)).fetchImpl });
  assert.deepEqual(await kinds(503, { error: "disabled", reason: "not-configured" }), { kind: "unavailable", reason: "not-configured" });
  assert.deepEqual(await kinds(503, { error: "disabled", reason: "killed" }), { kind: "unavailable", reason: "killed" });
  assert.deepEqual(await kinds(503, { error: "disabled", reason: "weird" }), { kind: "unavailable", reason: "unavailable" });
  assert.deepEqual(await kinds(429, { error: "quota", retryAfterSec: 3600 }), { kind: "quota", retryAfterSec: 3600 });
  assert.deepEqual(await kinds(429, { error: "rate" }, { "retry-after": "30" }), { kind: "rate", retryAfterSec: 30 });
  assert.deepEqual(await kinds(429, { error: "busy", retryAfterSec: 5 }), { kind: "busy", retryAfterSec: 5 });
  assert.deepEqual(await kinds(429, { error: "rate" }), { kind: "rate" });
  // A monthly budget can wait until next month; a nonsense retry is still capped.
  assert.deepEqual(await kinds(429, { error: "quota", retryAfterSec: 32 * 86_400 }), { kind: "quota", retryAfterSec: 32 * 86_400 });
  assert.deepEqual(await kinds(429, { error: "quota", retryAfterSec: 1e13 }), { kind: "quota", retryAfterSec: 40 * 86_400 });
  assert.deepEqual(await kinds(409, { error: "duplicate" }), { kind: "duplicate" });
  assert.deepEqual(await kinds(413, { error: "size" }), { kind: "too-large" });
  assert.deepEqual(await kinds(400, { error: "body", field: "prompt" }), { kind: "invalid-input", field: "prompt" });
  assert.deepEqual(await kinds(504, { error: "timeout", references: [] }), { kind: "timeout", references: [] });
  assert.deepEqual(await kinds(502, { error: "upstream" }), { kind: "upstream", references: [] });
  assert.deepEqual(await kinds(502, { error: "invalid-output", references: [{ url: "https://a.example.org/", status: "failed", reason: "timeout" }] }), { kind: "invalid-output", references: [{ url: "https://a.example.org/", status: "failed", reason: "timeout" }] });
  assert.deepEqual(await kinds(500, "oops"), { kind: "network" });
});

test("a network failure and a cancellation are told apart, and neither throws", async () => {
  const down = () => Promise.reject(new TypeError("fetch failed"));
  assert.deepEqual(await requestIdentity(input(), { fetchImpl: down }), { kind: "network" });
  const abort = () => Promise.reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
  assert.deepEqual(await requestIdentity(input(), { fetchImpl: abort }), { kind: "aborted" });
});

test("the limits are checked before anything is sent", async () => {
  const { fetchImpl, calls } = sends(json(200, {}));
  assert.equal((await requestIdentity(input({ prompt: "  " }), { fetchImpl })).kind, "invalid-input");
  assert.equal((await requestIdentity(input({ prompt: "x".repeat(1001) }), { fetchImpl })).kind, "invalid-input");
  assert.equal((await requestIdentity(input({ references: ["https://a.org", "https://b.org", "https://c.org", "https://d.org"] }), { fetchImpl })).kind, "invalid-input");
  assert.equal(calls.length, 0);
  assert.equal(checkInput({ prompt: "ok", references: [] }), "ok");
});

test("history is cut to what the service accepts", () => {
  const turns = Array.from({ length: 9 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: `${i} ${"x".repeat(600)}` }));
  const kept = trimHistory(turns);
  assert.equal(kept.length, 6);
  assert.ok(kept.every((turn) => turn.text.length <= 500));
  assert.match(kept[0].text, /^3 /);
});

test("request ids are ones the service accepts", () => {
  for (let i = 0; i < 20; i += 1) assert.match(newRequestId(), /^[A-Za-z0-9_-]{8,64}$/);
  assert.notEqual(newRequestId(), newRequestId());
});

test("status is free and says why generation is off, or that nothing could be reached", async () => {
  const status = (reply) => fetchAssistantStatus({ fetchImpl: () => (reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply)) });
  assert.deepEqual(await status(json(200, { available: true })), { available: true });
  assert.deepEqual(await status(json(200, { available: false, reason: "disabled" })), { available: false, reason: "disabled" });
  assert.deepEqual(await status(json(404, "")), { available: false, reason: "unreachable" });
  assert.deepEqual(await status(new TypeError("down")), { available: false, reason: "unreachable" });
  assert.deepEqual(await status(json(200, "junk")), { available: false, reason: "unavailable" });
});

test("a report is read as far as it is believed: at most the links that were sent, each field bounded", async () => {
  const many = Array.from({ length: 10 }, (_, i) => ({ url: `https://${"a".repeat(300)}${i}.example.org/`, status: "failed", reason: "constructor".padEnd(200, "x"), title: "T".repeat(500), host: "h".repeat(500) }));
  const out = await requestIdentity(input(), { fetchImpl: sends(json(200, { requestId: "request-0001", summary: "x", tokens: identityPresets.press, changed: [], references: many })).fetchImpl });
  assert.equal(out.kind, "ok");
  assert.equal(out.references.length, 3);
  for (const ref of out.references) {
    assert.ok(ref.url.length <= 200 && (ref.reason?.length ?? 0) <= 40 && (ref.title?.length ?? 0) <= 80 && (ref.host?.length ?? 0) <= 80);
  }
});

test("a reason is worded from a closed list: nothing the service sends can name a property of Object", async () => {
  const { referenceReason } = await import("../components/i18n/identity-assistant-copy.ts");
  for (const reason of ["constructor", "__proto__", "toString", "status-99999", "status-abc", undefined]) {
    assert.equal(referenceReason(reason), "it could not be read", String(reason));
  }
  assert.equal(referenceReason("status-404"), "the page answered with 404");
  assert.equal(referenceReason("timeout"), "it took too long to answer");
});
