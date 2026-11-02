import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

function tokens(css: string, name: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...stripped.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))].map((match) =>
    (match[1] ?? "").replace(/\s+/g, " ").trim(),
  );
}

function token(css: string, name: string): string | undefined {
  return tokens(css, name)[0];
}

describe("per-identity leading, border, colour duration (#799)", () => {
  it("keeps mist at today's stock values", () => {
    const stock = read("identities.css");
    expect(token(stock, "--zk-body-leading")).toBe("1.6");
    expect(token(stock, "--zk-border-width")).toBe("1px");
    expect(token(stock, "--zk-color-duration")).toBe("150ms");
    expect(read("styles.css")).toMatch(/--default-transition-duration:\s*var\(--zk-color-duration, 150ms\)/);
    expect(read("identities.css")).toMatch(
      /\.transition-colors\s*\{[^}]*transition-duration:\s*var\(--zk-color-duration, 150ms\)/,
    );
  });

  it("does not keep unused density knobs", () => {
    const files = ["identities.css", "identities/maison.css", "identities/glass.css"].map(read).join("\n");
    expect(files).not.toMatch(/--zk-density/);
    expect(files).not.toMatch(/--zk-control-scale/);
  });

  it("does not hover a whole calendar week as a data row", () => {
    expect(read("identities.css")).toMatch(/table:not\(\[role="grid"\]\)\s+tbody tr:hover/);
  });

  it("keeps a shared type scale and distinct tracking, shadow, spacing, and radius per identity", () => {
    const mistReset = read("identities.css").slice(read("identities.css").indexOf("Scoped mist resets the stock tokens."));
    const shared = read("shared-type-scale.css");
    const looks = {
      mist: mistReset,
      press: read("identities/press.css"),
      maison: read("identities/maison.css"),
      glass: read("identities/glass.css"),
      tide: read("identities/tide.css"),
      volt: read("identities/volt.css"),
    };
    const sharedBase = token(shared, "--text-base") ?? "";
    expect(token(shared, "--text-sm") ?? "").toBe("0.8125rem");
    expect(token(shared, "--text-base") ?? "").toBe("0.875rem");
    expect(token(shared, "--text-lg") ?? "").toBe("1.0625rem");
    expect(token(looks.mist, "--text-sm") ?? "").toBe("0.875rem");
    expect(token(looks.mist, "--text-lg") ?? "").toBe("1.125rem");
    expect(token(looks.mist, "--tracking-tight") ?? "").toBe("-0.025em");
    expect(token(looks.mist, "--spacing") ?? "").toBe("0.25rem");
    expect(token(looks.press, "--spacing") ?? "").toBe("0.2rem");
    expect(token(looks.tide, "--spacing") ?? "").toBe("0.28rem");
    expect(token(looks.glass, "--spacing") ?? "").toBe("0.32rem");
    const steps = ["--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl", "--text-2xl", "--text-3xl", "--text-4xl", "--text-5xl"] as const;
    const scaleCss = [shared, looks.mist];
    for (const css of scaleCss) {
      const rem = steps.map((name) => {
        const raw = token(css, name) ?? "0";
        if (raw.startsWith("clamp(")) {
          const min = raw.match(/clamp\(\s*([\d.]+rem)/)?.[1];
          return min ? Number.parseFloat(min) : 0;
        }
        return Number.parseFloat(raw);
      });
      for (let i = 1; i < rem.length; i++) {
        expect(rem[i]).toBeGreaterThan(rem[i - 1] ?? 0);
      }
    }
    for (const name of ["--tracking-tight", "--tracking-wide", "--zk-label-tracking", "--zk-shadow-xs", "--zk-shadow-sm", "--zk-shadow-md", "--zk-shadow-lg", "--zk-shadow-xl", "--zk-shadow-overlay", "--spacing", "--radius", "--radius-xs", "--radius-sm", "--radius-md", "--radius-xl", "--radius-2xl", "--zk-color-duration"] as const) {
      const seen = new Map<string, string>();
      for (const [id, css] of Object.entries(looks)) {
        const value = token(css, name) ?? "";
        expect(value.length).toBeGreaterThan(0);
        expect(seen.get(value) ?? "").toBe("");
        seen.set(value, id);
      }
    }
    expect(sharedBase).toBe("0.875rem");
    for (const [, css] of Object.entries(looks)) {
      const tracking = token(css, "--zk-heading-tracking") ?? "";
      const em = Number.parseFloat(tracking);
      expect(Number.isFinite(em)).toBe(true);
      expect(Math.abs(em)).toBeLessThanOrEqual(0.02);
    }
  });

  it("sets a distinct border and colour duration per identity (body leading is shared)", () => {
    const shared = read("shared-type-scale.css");
    expect(token(shared, "--zk-body-leading")).toBe("1.55");
    expect(token(read("identities/press.css"), "--zk-border-width")).toBe("1px");
    expect(token(read("identities/press.css"), "--zk-color-duration")).toBe("80ms");
    expect(token(read("identities/maison.css"), "--zk-color-duration")).toBe("200ms");
    expect(token(read("identities/maison.css"), "--radius-xs") ?? "").toBe("0.5px");
    expect(token(read("identities/maison.css"), "--zk-border-width") ?? "").toBe("1px");
    expect(token(read("identities/maison.css"), "--zk-shadow-md") ?? "").toBe(
      "0 1px 2px hsl(var(--zk-shadow-color) / 0.05), 0 4px 12px -8px hsl(var(--zk-shadow-color) / 0.06)",
    );
    expect(token(read("identities/maison.css"), "--zk-shadow-overlay") ?? "").toBe(
      "0 1px 2px hsl(var(--zk-shadow-color) / 0.08), 0 20px 44px -26px hsl(var(--zk-shadow-color) / 0.24)",
    );
    expect(token(read("identities/glass.css"), "--zk-color-duration")).toBe("220ms");
    expect(token(read("identities/glass.css"), "--zk-border-width") ?? "").toBe("0.5px");
    expect(token(read("identities/glass.css"), "--radius") ?? "").toBe("1.25rem");
    expect(token(read("identities/glass.css"), "--radius-sm") ?? "").toBe("0.625rem");
    expect(token(read("identities/glass.css"), "--radius-md") ?? "").toBe("0.875rem");
    expect(token(read("identities/glass.css"), "--radius-2xl") ?? "").toBe("2.25rem");
    expect(token(read("identities/glass.css"), "--radius-xl") ?? "").toBe("2rem");
    expect(token(read("identities/glass.css"), "--zk-shadow-xs") ?? "").toBe(
      "0 8px 24px -12px hsl(var(--zk-shadow-color) / 0.18)",
    );
    expect(token(read("identities/tide.css"), "--zk-color-duration")).toBe("180ms");
    expect(token(read("identities/tide.css"), "--zk-border-width") ?? "").toBe("1.5px");
    expect(token(read("identities/tide.css"), "--zk-shadow-sm") ?? "").toBe(
      "0 3px 10px hsl(var(--zk-shadow-color) / 0.12), 0 0 14px -4px hsl(10 71% 52% / 0.18)",
    );
    expect(token(read("identities/tide.css"), "--zk-shadow-overlay") ?? "").toBe(
      "0 28px 72px -18px hsl(var(--zk-shadow-color) / 0.36), 0 0 40px -12px hsl(10 71% 52% / 0.2)",
    );
    expect(token(read("identities/tide.css"), "--zk-shadow-xl") ?? "").toBe(
      "0 32px 80px -24px hsl(var(--zk-shadow-color) / 0.4), 0 0 48px -16px hsl(10 71% 52% / 0.26)",
    );
    expect(token(read("identities/volt.css"), "--zk-color-duration")).toBe("100ms");
    expect(token(read("identities/volt.css"), "--zk-border-width") ?? "").toBe("1.25px");
  });

  it("gives each identity its own dark --zk-shadow-xs", () => {
    const darkXs = {
      maison: tokens(read("identities/maison.css"), "--zk-shadow-xs")[1],
      glass: tokens(read("identities/glass.css"), "--zk-shadow-xs")[1],
      tide: tokens(read("identities/tide.css"), "--zk-shadow-xs")[1],
      volt: tokens(read("identities/volt.css"), "--zk-shadow-xs")[1],
    };
    expect(darkXs.maison).toBe("none");
    expect(darkXs.glass).toBe("0 8px 24px -12px rgb(0 0 0 / 0.55), var(--zk-glass-highlight)");
    expect(darkXs.tide).toBe("0 1px 3px rgb(0 0 0 / 0.42), 0 0 8px -2px hsl(var(--zk-shadow-color) / 0.16)");
    const seen = new Map<string, string>();
    for (const [id, value] of Object.entries(darkXs)) {
      expect(value ?? "").not.toBe("");
      expect(seen.get(value ?? "") ?? "").toBe("");
      seen.set(value ?? "", id);
    }
  });
});
