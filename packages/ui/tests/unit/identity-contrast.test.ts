import { describe, expect, it } from "vitest";

import { identityContrastWarnings, keepIdentityDarkKeys, withIdentityDarkPair } from "#identity-contrast.js";
import { identityPresets, identityTokenSchema, parseIdentityTokens } from "#identity-tokens.js";

function ofToken(
  tokens: ReturnType<typeof identityTokenSchema.parse>,
  token: "foreground" | "primaryForeground" | "mutedForeground" | "accent" | "border",
  scheme?: "light" | "dark",
) {
  return identityContrastWarnings(tokens).filter(
    (warning) => warning.token === token && (scheme === undefined || warning.scheme === scheme),
  );
}

describe("identityContrastWarnings", () => {
  it("accepts every shipped preset on text, accent, and border in light and dark", () => {
    for (const tokens of Object.values(identityPresets)) {
      expect(identityContrastWarnings(tokens)).toEqual([]);
    }
  });

  it("warns when light foreground matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, foreground: identityPresets.mist.light.background },
    });
    const warnings = ofToken(tokens, "foreground", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.ratio).toBeLessThan(4.5);
    expect(warnings[0]?.min).toBe(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, foreground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "foreground", "light")).toEqual([]);
  });

  it("warns when dark foreground matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      dark: { ...identityPresets.mist.dark, foreground: identityPresets.mist.dark.background },
    });
    const warnings = ofToken(tokens, "foreground", "dark");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.ratio).toBeLessThan(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      dark: { ...tokens.dark, foreground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "foreground", "dark")).toEqual([]);
  });

  it("warns when light accent matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: { ...identityPresets.mist.light, accent: identityPresets.mist.light.background },
    });
    const warnings = ofToken(tokens, "accent", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(3);
    expect(warnings[0]?.ratio).toBeLessThan(3);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, accent: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "accent", "light")).toEqual([]);
  });

  it("warns when primary text matches the primary fill", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: {
        ...identityPresets.mist.light,
        primaryForeground: identityPresets.mist.light.primary,
      },
    });
    const warnings = ofToken(tokens, "primaryForeground", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(4.5);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, primaryForeground: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "primaryForeground", "light")).toEqual([]);
  });

  it("warns when light border matches the background", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.press,
      light: { ...identityPresets.press.light, border: identityPresets.press.light.background },
    });
    const warnings = ofToken(tokens, "border", "light");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.min).toBe(3);
    expect(warnings[0]?.ratio).toBeLessThan(3);
    const fixed = parseIdentityTokens({
      ...tokens,
      light: { ...tokens.light, border: warnings[0]?.suggestedForeground },
    });
    expect(fixed.success).toBe(true);
    if (fixed.success) expect(ofToken(fixed.data, "border", "light")).toEqual([]);
  });
});

describe("withIdentityDarkPair", () => {
  it("writes an AA dark pair from a custom light pair", () => {
    const tokens = identityTokenSchema.parse({
      ...identityPresets.mist,
      light: {
        background: "200 80% 96%",
        foreground: "200 50% 12%",
        primary: "200 80% 36%",
        primaryForeground: "0 0% 100%",
        accent: "200 80% 32%",
        border: "200 30% 40%",
        mutedForeground: "200 50% 12%",
      },
    });
    const next = withIdentityDarkPair(tokens);
    expect(next.dark.background).not.toBe(identityPresets.mist.dark.background);
    expect(identityContrastWarnings(next)).toEqual([]);
  });

  it("keeps dark when light colours did not change", () => {
    const spaced = identityTokenSchema.parse({ ...identityPresets.mist, spacing: "0.4rem" });
    expect(withIdentityDarkPair(spaced, identityPresets.mist).dark).toEqual(identityPresets.mist.dark);
  });

  it("keeps a dark colour the user set and rewrites the rest", () => {
    const generated = withIdentityDarkPair(
      identityTokenSchema.parse({
        ...identityPresets.mist,
        light: { ...identityPresets.mist.light, background: "0 0% 95%" },
      }),
    );
    const previous = identityTokenSchema.parse({
      ...generated,
      dark: { ...generated.dark, background: "120 40% 20%" },
    });
    const rewritten = withIdentityDarkPair(
      identityTokenSchema.parse({
        ...previous,
        light: { ...previous.light, background: "200 80% 96%" },
      }),
      previous,
    );
    const next = keepIdentityDarkKeys(rewritten, previous, ["background"]);
    expect(rewritten.dark.background).not.toBe("120 40% 20%");
    expect(next.dark.background).toBe("120 40% 20%");
    expect(next.dark.foreground).toBe(rewritten.dark.foreground);
  });
});
