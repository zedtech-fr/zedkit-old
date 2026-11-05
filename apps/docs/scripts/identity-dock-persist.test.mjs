import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

import {
  clearIdentityDockPersist,
  encodeIdentityDockPersist,
  IDENTITY_DOCK_MAX_BYTES,
  IDENTITY_DOCK_MAX_THREAD_TURNS,
  IDENTITY_DOCK_STORAGE_KEY,
  trimSessionForPersist,
} from "../lib/identity-dock-persist.ts";
import { initialSession } from "../lib/identity-creator-session.ts";

test("trimSessionForPersist keeps the last 20 thread turns and clears pending", () => {
  const thread = Array.from({ length: 25 }, (_, i) => ({ role: "user", text: `turn-${i}` }));
  const session = { ...initialSession, thread, pending: { requestId: "r1", prompt: "x" } };
  const trimmed = trimSessionForPersist(session);
  assert.equal(trimmed.thread.length, IDENTITY_DOCK_MAX_THREAD_TURNS);
  assert.equal(trimmed.thread[0]?.text, "turn-5");
  assert.equal(trimmed.pending, null);
});

test("encodeIdentityDockPersist stays under the byte cap by dropping oldest turns", () => {
  const longText = "word ".repeat(4000);
  const thread = Array.from({ length: 30 }, () => ({ role: "user", text: longText }));
  const session = {
    ...initialSession,
    thread,
    proposal: {
      requestId: "r1",
      prompt: "p",
      tokens: identityPresets.mist,
      summary: longText,
      changed: ["radius"],
    },
    references: [{ url: "https://example.com/", status: "used", analysis: "text-only", host: "example.com", title: "Ex", chars: 10 }],
  };
  const encoded = encodeIdentityDockPersist({ session, brief: longText });
  assert.ok(encoded.length <= IDENTITY_DOCK_MAX_BYTES);
  const parsed = JSON.parse(encoded);
  assert.ok(parsed.session.thread.length <= IDENTITY_DOCK_MAX_THREAD_TURNS);
});

test("previewTokens round-trip through encode and parse", () => {
  const previewTokens = { ...identityPresets.mist, radius: "0.875rem" };
  const session = {
    ...initialSession,
    thread: [{ role: "user", text: "A calm shop" }, { role: "assistant", text: "Softer corners." }],
  };
  const encoded = encodeIdentityDockPersist({
    session,
    brief: "refine",
    previewTokens,
    previewDomain: "editorial",
  });
  const parsed = JSON.parse(encoded);
  assert.equal(parsed.previewTokens.radius, "0.875rem");
  assert.equal(parsed.previewDomain, "editorial");
  assert.equal(parsed.brief, "refine");
});

test("previewDomain survives when encode drops oldest thread turns", () => {
  const longText = "word ".repeat(4000);
  const thread = [
    { role: "user", text: "I run a daily newspaper" },
    ...Array.from({ length: 30 }, () => ({ role: "user", text: longText })),
  ];
  const session = { ...initialSession, thread };
  const encoded = encodeIdentityDockPersist({
    session,
    brief: "",
    previewTokens: identityPresets.mist,
    previewDomain: "editorial",
  });
  assert.ok(encoded.length <= IDENTITY_DOCK_MAX_BYTES);
  const parsed = JSON.parse(encoded);
  assert.equal(parsed.previewDomain, "editorial");
});

test("clearIdentityDockPersist removes the v2 storage key", () => {
  const store = new Map();
  const localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
    removeItem: (k) => {
      store.delete(k);
    },
  };
  globalThis.window = { localStorage };
  store.set(IDENTITY_DOCK_STORAGE_KEY, "{}");
  clearIdentityDockPersist();
  assert.equal(store.has(IDENTITY_DOCK_STORAGE_KEY), false);
  delete globalThis.window;
});
