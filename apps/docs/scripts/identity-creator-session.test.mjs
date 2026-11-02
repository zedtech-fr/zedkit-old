import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

import { initialSession, sessionReducer } from "../lib/identity-creator-session.ts";

const ok = (requestId, summary = "Rounder.") => ({ kind: "ok", requestId, tokens: identityPresets.press, summary, changed: ["radius"], references: [{ url: "https://a.example.org/", status: "used", analysis: "text-only" }] });
const run = (...actions) => actions.reduce(sessionReducer, initialSession);

test("a submit makes one pending request, and a second submit while it waits is ignored", () => {
  const first = run({ type: "submit", requestId: "a", prompt: "  A calm studio  " });
  assert.deepEqual(first.pending, { requestId: "a", prompt: "A calm studio" });
  assert.equal(sessionReducer(first, { type: "submit", requestId: "b", prompt: "again" }), first, "the same state, so no second paid job");
});

test("an answer to the pending request becomes a proposal, never an applied identity", () => {
  const s = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "result", requestId: "a", result: ok("a") });
  assert.equal(s.pending, null);
  assert.equal(s.proposal.prompt, "calm");
  assert.deepEqual(s.thread, [], "nothing is in the conversation until the visitor accepts");
  assert.equal(s.references[0].analysis, "text-only");
});

test("a late answer to a cancelled request cannot resurrect it", () => {
  const s = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "cancel" }, { type: "result", requestId: "a", result: ok("a") });
  assert.equal(s.proposal, null);
  assert.deepEqual(s.notice, { kind: "cancelled" });
});

test("a late answer to a superseded request cannot overwrite newer work", () => {
  let s = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "cancel" }, { type: "submit", requestId: "b", prompt: "warm" });
  s = sessionReducer(s, { type: "result", requestId: "a", result: ok("a", "stale") });
  assert.equal(s.proposal, null);
  assert.equal(s.pending.requestId, "b", "the newer request is still the one that counts");
  s = sessionReducer(s, { type: "result", requestId: "b", result: ok("b", "fresh") });
  assert.equal(s.proposal.summary, "fresh");
  s = sessionReducer(s, { type: "result", requestId: "a", result: ok("a", "stale again") });
  assert.equal(s.proposal.summary, "fresh");
});

test("an answer nobody asked for is dropped", () => {
  assert.equal(sessionReducer(initialSession, { type: "result", requestId: "x", result: ok("x") }), initialSession);
});

test("the last proposal stays while the next one loads or fails", () => {
  let s = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "result", requestId: "a", result: ok("a", "first") });
  s = sessionReducer(s, { type: "submit", requestId: "b", prompt: "calmer" });
  assert.equal(s.proposal.summary, "first", "kept while loading");
  s = sessionReducer(s, { type: "result", requestId: "b", result: { kind: "quota", retryAfterSec: 3600 } });
  assert.equal(s.proposal.summary, "first", "kept after a failure");
  assert.deepEqual(s.notice, { kind: "quota", retryAfterSec: 3600 });
  assert.equal(s.pending, null);
});

test("a failure keeps what the page can word, and the report of references that failed", () => {
  const failed = { kind: "invalid-output", references: [{ url: "https://a.example.org/", status: "failed", reason: "timeout" }] };
  const s = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "result", requestId: "a", result: failed });
  assert.equal(s.notice.kind, "invalid-output");
  assert.deepEqual(s.references, failed.references);
  assert.equal(s.proposal, null);
});

test("accepting moves the exchange into the conversation; discarding leaves no trace of it", () => {
  const proposed = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "result", requestId: "a", result: ok("a", "Softer corners.") });
  const accepted = sessionReducer(proposed, { type: "accept" });
  assert.equal(accepted.proposal, null);
  assert.deepEqual(accepted.thread, [{ role: "user", text: "calm" }, { role: "assistant", text: "Softer corners." }]);
  const discarded = sessionReducer(proposed, { type: "discard" });
  assert.deepEqual(discarded.thread, []);
  assert.equal(discarded.proposal, null);
  assert.equal(sessionReducer(initialSession, { type: "accept" }), initialSession);
});

test("the conversation sent as history stays bounded", () => {
  let s = initialSession;
  for (let i = 0; i < 20; i += 1) {
    s = sessionReducer(s, { type: "submit", requestId: `r${i}`, prompt: `p${i}` });
    s = sessionReducer(s, { type: "result", requestId: `r${i}`, result: ok(`r${i}`, `s${i}`) });
    s = sessionReducer(s, { type: "accept" });
  }
  assert.equal(s.thread.length, 12);
  assert.equal(s.thread.at(-1).text, "s19");
});

test("reset starts over", () => {
  const s = run({ type: "submit", requestId: "a", prompt: "calm" }, { type: "reset" });
  assert.deepEqual(s, initialSession);
});
