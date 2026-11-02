import { expect, test } from "@playwright/test";
import { identityPresets, tokensToCss, withIdentityDarkPair, type IdentityTokens } from "@zedtech/zedkit-ui";

import {
  LIGHT_KEYS,
  SCALAR_KEYS,
  parseIdentityEditorSearch,
  serializeIdentityEditorSearch,
} from "../lib/identity-editor-search";
import { parseRecipe, serializeRecipe } from "../lib/identity-recipe";

/** The export is a recipe (see the export copy). These tests pin what that recipe preserves. */

const clone = (tokens: IdentityTokens): IdentityTokens => ({ ...tokens, light: { ...tokens.light }, dark: { ...tokens.dark } });

for (const [id, preset] of Object.entries(identityPresets)) {
  test(`${id}: export then import returns the same tokens and CSS`, () => {
    const result = parseRecipe(serializeRecipe(preset));
    if (!result.ok) throw new Error(`import failed: ${JSON.stringify(result.reason)}`);
    expect(result.tokens).toEqual(preset);
    expect(tokensToCss(result.tokens, ":root")).toBe(tokensToCss(preset, ":root"));
  });
}

test("every supported field survives a round trip when edited", () => {
  const edited = clone(identityPresets.tide);
  const changed: Record<string, string> = {
    spacing: "0.31rem",
    borderWidth: "2px",
    radius: "0.75rem",
    bodyLeading: "1.7",
    headingLeading: "1.2",
    headingTracking: "-0.03em",
    labelTracking: "0.1em",
    shadowSm: "0 1px 2px 0 rgb(0 0 0 / 0.2)",
    shadowMd: "0 6px 8px -2px rgb(0 0 0 / 0.2)",
  };
  for (const key of SCALAR_KEYS) edited[key] = changed[key]!;
  edited.fontSans = '"Test Sans", sans-serif';
  edited.fontDisplay = '"Test Display", serif';
  LIGHT_KEYS.forEach((key, index) => {
    edited.light[key] = `${10 + index * 20} 40% ${30 + index}%`;
    edited.dark[key] = `${200 + index * 10} 30% ${60 + index}%`;
  });
  const result = parseRecipe(serializeRecipe(edited));
  if (!result.ok) throw new Error(JSON.stringify(result.reason));
  expect(result.tokens).toEqual(edited);
});

test("dark colours that were set by hand come back kept, generated ones do not", () => {
  const base = clone(identityPresets.mist);
  const generated = withIdentityDarkPair(base);
  const result = parseRecipe(serializeRecipe(generated));
  if (!result.ok) throw new Error("import failed");
  expect(result.darkKept).toEqual([]);

  const manual = clone(generated);
  manual.dark.accent = "120 40% 20%";
  const manualResult = parseRecipe(serializeRecipe(manual));
  if (!manualResult.ok) throw new Error("import failed");
  expect(manualResult.darkKept).toEqual(["accent"]);
});

test("the recipe keeps independent light and dark palettes (no flattening to one palette)", () => {
  const result = parseRecipe(serializeRecipe(identityPresets.press));
  if (!result.ok) throw new Error("import failed");
  expect(result.tokens.light.background).not.toBe(result.tokens.dark.background);
  expect(result.tokens.light.primary).not.toBe(result.tokens.dark.primary);
});

/** The shareable link is the second way a draft leaves the editor: it must carry what the recipe carries. */
test.describe("the editor link carries the whole recipe", () => {
  const withFonts = (tokens: IdentityTokens): IdentityTokens => ({
    ...clone(tokens),
    fontSans: '"Test Sans", ui-sans-serif, sans-serif',
    fontDisplay: '"Test Display", Georgia, serif',
  });

  test("custom font stacks survive link serialization and restoration", () => {
    for (const base of [identityPresets.mist, identityPresets.press, identityPresets.volt]) {
      const edited = withFonts(base);
      const restored = parseIdentityEditorSearch(serializeIdentityEditorSearch("mist", edited, false));
      expect(restored.tokens.fontSans).toBe(edited.fontSans);
      expect(restored.tokens.fontDisplay).toBe(edited.fontDisplay);
    }
  });

  test("a font that differs from the preset is written once, one that matches is not", () => {
    const query = new URLSearchParams(
      serializeIdentityEditorSearch("mist", { ...clone(identityPresets.mist), fontDisplay: '"Test Display", serif' }, false),
    );
    expect(query.get("fontDisplay")).toBe('"Test Display", serif');
    expect(query.has("fontSans")).toBe(false);
  });

  test("independent light and dark palettes stay independent next to the fonts", () => {
    const edited = withFonts(identityPresets.press);
    edited.light.primary = "10 50% 30%";
    edited.dark.primary = "200 60% 70%";
    const restored = parseIdentityEditorSearch(serializeIdentityEditorSearch("press", edited, true));
    expect(restored.tokens).toEqual(edited);
    expect(restored.darkPreview).toBe(true);
  });

  test("an older link without font keys still opens the preset's own fonts", () => {
    const restored = parseIdentityEditorSearch("?identity=press&radius=0.75rem&preview=dark");
    expect(restored.tokens.fontSans).toBe(identityPresets.press.fontSans);
    expect(restored.tokens.fontDisplay).toBe(identityPresets.press.fontDisplay);
    expect(restored.tokens.radius).toBe("0.75rem");
  });

  test("a link cannot carry anything that would leave the declaration it is written into", () => {
    for (const hostile of [
      "x; } body { display: none",
      "Georgia } @import url(//evil.test/x.css)",
      "Georgia /* open",
      "url(https://evil.test/font.woff2)",
      "<style>",
      "calc(",
    ]) {
      const restored = parseIdentityEditorSearch(`?identity=mist&fontSans=${encodeURIComponent(hostile)}`);
      expect(restored.tokens.fontSans).toBe(identityPresets.mist.fontSans);
    }
  });
});

test("bad input names its reason instead of loading", () => {
  expect(parseRecipe("{ not json")).toEqual({ ok: false, reason: "not-json" });
  const missing = parseRecipe(JSON.stringify({ ...identityPresets.mist, radius: undefined }));
  expect(missing).toMatchObject({ ok: false, reason: { path: "radius" } });
  const badColour = parseRecipe(JSON.stringify({ ...identityPresets.mist, light: { ...identityPresets.mist.light, accent: "red" } }));
  expect(badColour).toMatchObject({ ok: false, reason: { path: "light.accent" } });
});

test("the recipe is limited, and says so: it paints surfaces from the page colour and one radius", () => {
  const css = tokensToCss(identityPresets.tide, ":root");
  // Distinctions the format cannot carry; the export copy must keep naming them.
  expect(css).toMatch(/--card:\s*20 60% 99%/);
  expect(css).toMatch(/--radius-xl:\s*1rem/);
  expect(css).toMatch(/--radius-3xl:\s*1rem/);
});
