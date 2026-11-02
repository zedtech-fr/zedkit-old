import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

import { FONT_STACKS, fontsAllowed, mergePatch, validateTokens } from "./tokens.mjs";

const UI_DIST = join(dirname(fileURLToPath(import.meta.url)), "../../packages/ui/dist/identity-tokens.js");

// The service ports the UI's schema; this test is what keeps the port honest. It needs the built kit
// (`pnpm --filter @zedtech/zedkit-ui build`, which CI runs before this suite).
assert.ok(existsSync(UI_DIST), `build @zedtech/zedkit-ui first: ${UI_DIST} is missing`);
const ui = await import(pathToFileURL(UI_DIST).href);
const uiParse = (input) => {
  const result = ui.parseIdentityTokens(input);
  return result.success ? result.data : null;
};

const SCALARS = ["spacing", "borderWidth", "radius", "bodyLeading", "headingLeading", "headingTracking", "labelTracking", "fontSans", "fontDisplay", "shadowSm", "shadowMd"];
const COLOURS = ["background", "foreground", "primary", "primaryForeground", "accent", "border", "mutedForeground"];

function prng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOSTILE = [
  undefined, null, "", " ", "x", "0 0% 0%", "360 100% 50%", "240 10% 3.9", "240  10%  3.9%", "0 0% 100% / 0.5", "0 0% 100%\n", "1.5", ".5", "5.", "1e3",
  "-0.02em", "0.5em", "-.5em", "0.5rem", "1px", "calc(1px + 2px)", "}", "{", ";", "a;b", "url(x)", "URL (x)", "@import", "\\", "/* c */", "<b>", '"unclosed',
  "'single", "'a\nb'", "a\tb", "a\u0000b", "\u007f", "a\rb", "(unbalanced", "[x]", "((x))", "x)(", "x".repeat(400), "x".repeat(401), 12, true, {}, [], ["a"], "1 2% 3%", "-1 2% 3%", "1 2 3",
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const sample = (random, list) => list[Math.floor(random() * list.length)];

function mutate(random, base) {
  const next = clone(base);
  const edits = 1 + Math.floor(random() * 3);
  for (let i = 0; i < edits; i += 1) {
    const value = sample(random, HOSTILE);
    if (random() < 0.5) {
      const key = sample(random, SCALARS);
      if (value === undefined) delete next[key];
      else next[key] = value;
    } else {
      const scheme = random() < 0.5 ? "light" : "dark";
      const key = sample(random, COLOURS);
      if (value === undefined) delete next[scheme][key];
      else next[scheme][key] = value;
    }
  }
  return next;
}

test("every preset is accepted by both, and both read it the same way", () => {
  for (const [id, tokens] of Object.entries(ui.identityPresets)) {
    assert.deepEqual(validateTokens(tokens), uiParse(tokens), id);
    assert.notEqual(validateTokens(tokens), null, id);
  }
});

test("optional colours default to the foreground in both", () => {
  const tokens = clone(ui.identityPresets.mist);
  delete tokens.light.primaryForeground;
  delete tokens.dark.mutedForeground;
  const mine = validateTokens(tokens);
  assert.deepEqual(mine, uiParse(tokens));
  assert.equal(mine.light.primaryForeground, mine.light.foreground);
  assert.equal(mine.dark.mutedForeground, mine.dark.foreground);
});

test("a seeded fuzz of hostile values gets the same answer from both, every time", () => {
  const random = prng(20261102);
  const presets = Object.values(ui.identityPresets);
  let accepted = 0;
  let refused = 0;
  for (let i = 0; i < 6_000; i += 1) {
    const input = mutate(random, sample(random, presets));
    const mine = validateTokens(input);
    const theirs = uiParse(input);
    assert.deepEqual(mine, theirs, `case ${i}: ${JSON.stringify(input).slice(0, 400)}`);
    if (theirs) accepted += 1;
    else refused += 1;
  }
  assert.ok(accepted > 200 && refused > 200, `the fuzz must exercise both outcomes (accepted ${accepted}, refused ${refused})`);
});

test("non-objects and arrays are refused by both", () => {
  for (const input of [null, undefined, 0, "x", [], [{}], true]) {
    assert.equal(validateTokens(input), null);
    assert.equal(uiParse(input), null);
  }
});

test("a patch merges over the current tokens exactly as the UI would read the merged result", () => {
  const current = clone(ui.identityPresets.press);
  const merged = mergePatch(current, { radius: "0.75rem", light: { primary: "10 80% 30%" }, dark: { mutedForeground: "0 0% 80%" } });
  const by = clone(current);
  by.radius = "0.75rem";
  by.light.primary = "10 80% 30%";
  by.dark.mutedForeground = "0 0% 80%";
  assert.deepEqual(merged, uiParse(by));
  assert.equal(mergePatch(current, { radius: "}" }), null);
  assert.equal(mergePatch(current, { light: { background: "nope" } }), null);
  assert.deepEqual(mergePatch(current, {}), uiParse(current));
  assert.deepEqual(mergePatch(current, "not an object"), uiParse(current));
});

test("the font list is the set the kit's own presets use, plus plain system stacks", () => {
  for (const preset of Object.values(ui.identityPresets)) {
    assert.ok(FONT_STACKS.includes(preset.fontSans), preset.fontSans);
    assert.ok(FONT_STACKS.includes(preset.fontDisplay), preset.fontDisplay);
  }
});

test("a generated identity keeps its fonts or picks from the list: nothing invented", () => {
  const current = clone(ui.identityPresets.mist);
  const pick = clone(current);
  pick.fontDisplay = FONT_STACKS[2];
  assert.equal(fontsAllowed(pick, current), true);
  const invented = clone(current);
  invented.fontSans = '"Comic Neue", cursive';
  assert.equal(fontsAllowed(invented, current), false);
  const imported = clone(current);
  imported.fontSans = '"My Imported Face", serif';
  assert.equal(fontsAllowed(imported, imported), true, "a font the visitor already chose stays");
});
