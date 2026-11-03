import assert from "node:assert/strict";
import test from "node:test";

import { identityContrastWarnings, identityPresets } from "@zedtech/zedkit-ui";

import { repairContrast } from "../lib/identity-contrast-repair.ts";

test("a identity that already passes is returned as it is", () => {
  for (const preset of Object.values(identityPresets)) {
    const out = repairContrast(preset);
    assert.equal(out.adjusted, 0);
    assert.deepEqual(out.tokens, preset);
  }
});

test("pale text on a pale background is moved until it passes, in both modes, and nothing else changes", () => {
  const weak = { ...identityPresets.mist, light: { ...identityPresets.mist.light, foreground: "0 0% 80%" }, dark: { ...identityPresets.mist.dark, foreground: "0 0% 20%" } };
  assert.ok(identityContrastWarnings(weak).length >= 2);
  const out = repairContrast(weak);
  assert.deepEqual(identityContrastWarnings(out.tokens), []);
  assert.ok(out.adjusted >= 2);
  assert.equal(out.tokens.radius, weak.radius);
  assert.equal(out.tokens.light.background, weak.light.background);
  assert.equal(out.tokens.fontSans, weak.fontSans);
});

test("a mid-tone background that the old one-way nudge left below 4.5:1 now reaches the target", () => {
  // Gray 62% has luminance just above the black/white crossover but under 0.5, so lightening the text can never
  // pass; only darkening does. The previous nudge lightened, ended at white and still reported success.
  const midTone = { ...identityPresets.mist, light: { ...identityPresets.mist.light, background: "0 0% 62%", foreground: "0 0% 70%" } };
  const out = repairContrast(midTone);
  assert.equal(out.remaining, 0);
  assert.deepEqual(identityContrastWarnings(out.tokens), []);
});
