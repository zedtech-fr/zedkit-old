import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_BRIEF_KEY,
  readCreatorSessionBrief,
  writeCreatorSessionBrief,
} from "../lib/creator-session-brief.ts";

function store(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
  };
}

test("a brief is still there after a second read", () => {
  const s = store();
  assert.equal(writeCreatorSessionBrief(s, "A ceramics shop"), true);
  assert.equal(readCreatorSessionBrief(s), "A ceramics shop");
  assert.equal(readCreatorSessionBrief(s), "A ceramics shop");
});

test("empty or whitespace clears the draft", () => {
  const s = store();
  writeCreatorSessionBrief(s, "keep me");
  assert.equal(writeCreatorSessionBrief(s, "  "), true);
  assert.equal(readCreatorSessionBrief(s), null);
  assert.equal(s.data.has(SESSION_BRIEF_KEY), false);
});

test("nothing stored, broken storage and junk all read as no brief", () => {
  assert.equal(readCreatorSessionBrief(store()), null);
  assert.equal(readCreatorSessionBrief(undefined), null);
  assert.equal(readCreatorSessionBrief(store({ [SESSION_BRIEF_KEY]: "   " })), null);
  const blocked = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(readCreatorSessionBrief(blocked), null);
  assert.equal(writeCreatorSessionBrief(blocked, "x"), false);
  assert.equal(writeCreatorSessionBrief(undefined, "x"), false);
});

test("a brief is cut to the prompt limit", () => {
  const s = store();
  writeCreatorSessionBrief(s, "x".repeat(2000));
  assert.equal(readCreatorSessionBrief(s).length, 1000);
});
