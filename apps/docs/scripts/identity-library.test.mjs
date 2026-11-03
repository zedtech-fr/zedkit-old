import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

import {
  LEGACY_KEY,
  LIBRARY_KEY,
  LIBRARY_VERSION,
  MAX_ITEMS,
  deleteIdentity,
  exportRecipe,
  freeLabel,
  importRecipe,
  readLibrary,
  renameIdentity,
  saveIdentity,
} from "../lib/identity-library.ts";

const TOKENS = identityPresets.press;
const OTHER = identityPresets.tide;

/** A Storage stand-in that can be made to fail the way browsers do. */
function memory({ full = false, blocked = false } = {}) {
  const data = new Map();
  return {
    data,
    getItem: (key) => {
      if (blocked) throw new Error("SecurityError");
      return data.has(key) ? data.get(key) : null;
    },
    setItem: (key, value) => {
      if (blocked) throw new Error("SecurityError");
      if (full) throw Object.assign(new Error("quota"), { name: "QuotaExceededError" });
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

test("an empty library reads as empty, with nothing wrong", () => {
  assert.deepEqual(readLibrary(memory()), { items: [], dropped: 0 });
});

test("a saved identity comes back as it went in, versioned, with its fonts", () => {
  const storage = memory();
  const saved = saveIdentity(storage, { label: "  Atelier   Nord ", tokens: TOKENS, source: "assistant" }, 1_000);
  assert.equal(saved.ok, true);
  assert.equal(saved.item.label, "Atelier Nord");
  assert.match(saved.item.id, /^n-atelier-nord$/);
  const stored = JSON.parse(storage.data.get(LIBRARY_KEY));
  assert.equal(stored.version, 2);
  const read = readLibrary(storage);
  assert.equal(read.items.length, 1);
  assert.deepEqual(read.items[0].tokens, TOKENS);
  assert.equal(read.items[0].tokens.fontDisplay, TOKENS.fontDisplay, "the same font stacks after a reload");
  assert.equal(read.items[0].source, "assistant");
  assert.equal(read.items[0].createdAt, 1_000);
});

test("saving under a name that is taken asks first and writes nothing", () => {
  const storage = memory();
  saveIdentity(storage, { label: "Press", tokens: TOKENS });
  const before = storage.data.get(LIBRARY_KEY);
  const again = saveIdentity(storage, { label: "press", tokens: OTHER });
  assert.equal(again.ok, false);
  assert.equal(again.reason, "exists");
  assert.equal(again.existing.label, "Press");
  assert.equal(storage.data.get(LIBRARY_KEY), before, "the stored library is untouched");
  const replaced = saveIdentity(storage, { label: "press", tokens: OTHER, replace: true }, 5_000);
  assert.equal(replaced.ok, true);
  assert.equal(readLibrary(storage).items.length, 1);
  assert.deepEqual(readLibrary(storage).items[0].tokens, OTHER);
  assert.equal(readLibrary(storage).items[0].updatedAt, 5_000);
  assert.equal(freeLabel(readLibrary(storage).items, "Press"), "Press 2");
});

test("an invalid identity or an empty name is refused, whatever it looks like", () => {
  const storage = memory();
  assert.equal(saveIdentity(storage, { label: "x", tokens: { ...TOKENS, radius: "}" } }).reason, "invalid");
  assert.equal(saveIdentity(storage, { label: "   ", tokens: TOKENS }).reason, "invalid");
  assert.equal(storage.data.size, 0);
});

test("rename and delete keep the rest, and a taken name is not taken over", () => {
  const storage = memory();
  const a = saveIdentity(storage, { label: "One", tokens: TOKENS }).item;
  const b = saveIdentity(storage, { label: "Two", tokens: OTHER }).item;
  assert.equal(renameIdentity(storage, a.id, "two").reason, "exists");
  assert.equal(renameIdentity(storage, "n-missing", "Three").reason, "missing");
  assert.equal(renameIdentity(storage, a.id, "Three").ok, true);
  assert.deepEqual(readLibrary(storage).items.map((item) => item.label), ["Three", "Two"]);
  assert.equal(deleteIdentity(storage, b.id), "ok");
  assert.equal(deleteIdentity(storage, b.id), "missing");
  assert.deepEqual(readLibrary(storage).items.map((item) => item.label), ["Three"]);
});

test("the older, unversioned key is read, and replaced on the next write", () => {
  const storage = memory();
  storage.data.set(LEGACY_KEY, JSON.stringify([{ id: "n-old-look", label: "Old look", tokens: TOKENS }, { id: "n-bad", label: "Bad", tokens: { nope: 1 } }]));
  const read = readLibrary(storage);
  assert.deepEqual(read.items.map((item) => item.id), ["n-old-look"]);
  assert.equal(read.dropped, 1);
  saveIdentity(storage, { label: "New", tokens: OTHER });
  assert.equal(storage.data.has(LEGACY_KEY), false);
  assert.deepEqual(readLibrary(storage).items.map((item) => item.label), ["Old look", "New"]);
});

test("invalid entries are dropped and counted, never rendered", () => {
  const storage = memory();
  const good = { id: "n-good", label: "Good", tokens: TOKENS };
  const evil = { id: "n-evil", label: "Evil", tokens: { ...TOKENS, shadowSm: "0 0 0 red; } body { display: none" } };
  const wrongPrefix = { id: "custom", label: "Custom", tokens: TOKENS };
  const dup = { ...good };
  storage.data.set(LIBRARY_KEY, JSON.stringify({ version: 2, items: [good, evil, wrongPrefix, dup, null, "x"] }));
  const read = readLibrary(storage);
  assert.deepEqual(read.items.map((item) => item.id), ["n-good"]);
  assert.equal(read.dropped, 5);
});

test("an id that could leave its CSS selector is dropped, not applied", () => {
  const storage = memory();
  const good = { id: "n-good", label: "Good", tokens: TOKENS };
  const breakout = { id: 'n-a"]{} body{display:none} [x="', label: "Breakout", tokens: TOKENS };
  const spaced = { id: "n-a b", label: "Spaced", tokens: TOKENS };
  const upper = { id: "n-Upper", label: "Upper", tokens: TOKENS };
  storage.data.set(LIBRARY_KEY, JSON.stringify({ version: 2, items: [good, breakout, spaced, upper] }));
  const read = readLibrary(storage);
  assert.deepEqual(read.items.map((item) => item.id), ["n-good"]);
  assert.equal(read.dropped, 3);
});

test("corrupt storage is reported, copied aside before it is overwritten, and does not throw", () => {
  const storage = memory();
  storage.data.set(LIBRARY_KEY, "{not json");
  assert.equal(readLibrary(storage).problem, "corrupt");
  assert.equal(saveIdentity(storage, { label: "Fresh", tokens: TOKENS }).ok, true);
  assert.equal(storage.data.get("zk-identity-library-corrupt"), "{not json");
  assert.equal(readLibrary(storage).items.length, 1);
  storage.data.set(LIBRARY_KEY, JSON.stringify({ version: 2 }));
  assert.equal(readLibrary(storage).problem, "corrupt");
});

test("storage that is full or blocked gives named results, not exceptions", () => {
  assert.equal(saveIdentity(memory({ full: true }), { label: "X", tokens: TOKENS }).reason, "full");
  assert.equal(saveIdentity(memory({ blocked: true }), { label: "X", tokens: TOKENS }).reason, "unavailable");
  assert.equal(readLibrary(memory({ blocked: true })).problem, "unavailable");
  assert.equal(saveIdentity(undefined, { label: "X", tokens: TOKENS }).reason, "unavailable");
  assert.equal(readLibrary(undefined).problem, "unavailable");
});

test("export is a named recipe, and import accepts it or bare tokens, nothing else", () => {
  const item = saveIdentity(memory(), { label: "Press", tokens: TOKENS }).item;
  const text = exportRecipe(item);
  const back = importRecipe(text);
  assert.equal(back.name, "Press");
  assert.deepEqual(back.tokens, TOKENS);
  assert.deepEqual(importRecipe(JSON.stringify(TOKENS)).tokens, TOKENS);
  assert.equal(importRecipe("nope"), null);
  assert.equal(importRecipe(JSON.stringify({ format: "zedkit-identity", tokens: { x: 1 } })), null);
  assert.equal(importRecipe("[]"), null);
});

test("a library written by a newer page is not edited: it is reported, and kept aside before any write", () => {
  const storage = memory();
  const future = JSON.stringify({ version: LIBRARY_VERSION + 1, items: [{ id: "n-a", label: "A", tokens: TOKENS }] });
  storage.data.set(LIBRARY_KEY, future);
  assert.equal(readLibrary(storage).problem, "corrupt");
  assert.equal(saveIdentity(storage, { label: "Fresh", tokens: TOKENS }).ok, true);
  assert.equal(storage.data.get("zk-identity-library-corrupt") ?? [...storage.data.values()].find((value) => value === future), future, "a copy of the newer value survives");
});

test("a runaway library is read up to the limit the editor enforces, and the rest is counted", () => {
  const storage = memory();
  const rows = Array.from({ length: MAX_ITEMS + 30 }, (_, i) => ({ id: `n-look-${i}`, label: `Look ${i}`, tokens: TOKENS }));
  storage.data.set(LIBRARY_KEY, JSON.stringify({ version: LIBRARY_VERSION, items: rows }));
  const read = readLibrary(storage);
  assert.equal(read.items.length, MAX_ITEMS);
  assert.equal(read.dropped, 30);
});

test("invisible and control characters do not make two labels look different", () => {
  const storage = memory();
  assert.equal(saveIdentity(storage, { label: "Atelier", tokens: TOKENS }).ok, true);
  const again = saveIdentity(storage, { label: "Ate\u200blier\u0007", tokens: TOKENS });
  assert.equal(again.ok, false);
  assert.equal(again.reason, "exists");
});
