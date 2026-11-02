import assert from "node:assert/strict";
import test from "node:test";

import { HANDOFF_KEY, readCreatorHandoff, writeCreatorHandoff } from "../lib/creator-handoff.ts";

function store(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => void data.set(k, String(v)), removeItem: (k) => void data.delete(k) };
}

test("a brief is read once, then gone", () => {
  const s = store();
  assert.equal(writeCreatorHandoff(s, { brief: "A ceramics shop, like https://a.example.org/" }), true);
  assert.deepEqual(readCreatorHandoff(s), { brief: "A ceramics shop, like https://a.example.org/" });
  assert.equal(readCreatorHandoff(s), null);
});

test("nothing waiting, broken storage and junk all read as no brief", () => {
  assert.equal(readCreatorHandoff(store()), null);
  assert.equal(readCreatorHandoff(undefined), null);
  assert.equal(readCreatorHandoff(store({ [HANDOFF_KEY]: "{nope" })), null);
  assert.equal(readCreatorHandoff(store({ [HANDOFF_KEY]: JSON.stringify({ brief: "  " }) })), null);
  assert.equal(readCreatorHandoff(store({ [HANDOFF_KEY]: JSON.stringify([1]) })), null);
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
  assert.equal(readCreatorHandoff(blocked), null);
  assert.equal(writeCreatorHandoff(blocked, { brief: "x" }), false);
});

test("a brief is cut to its limit", () => {
  const s = store({ [HANDOFF_KEY]: JSON.stringify({ brief: "x".repeat(2000) }) });
  assert.equal(readCreatorHandoff(s).brief.length, 1000);
});
