import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

function token(css: string, name: string): string | undefined {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const match = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`).exec(stripped);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function remPx(value: string): number {
  const trimmed = value.trim();
  if (trimmed.startsWith("clamp(")) {
    const min = trimmed.match(/clamp\(\s*([0-9.]+rem)/)?.[1];
    if (min) return Number.parseFloat(min) * 16;
  }
  if (trimmed.endsWith("rem")) return Number.parseFloat(trimmed) * 16;
  if (trimmed.endsWith("px")) return Number.parseFloat(trimmed);
  return Number.parseFloat(trimmed);
}

const shared = read("shared-type-scale.css");
const identityFiles = readdirSync(join(src, "identities")).filter((f) => f.endsWith(".css"));

describe("shared type scale (P0)", () => {
  it("defines semantic roles and a 14px body base (16px is inputs only)", () => {
    expect(token(shared, "--zk-type-base")).toBe("0.875rem");
    expect(token(shared, "--text-base")).toBe("0.875rem");
    expect(remPx(token(shared, "--text-xs") ?? "0")).toBe(12);
    expect(remPx(token(shared, "--text-sm") ?? "0")).toBe(13);
    expect(remPx(token(shared, "--text-base") ?? "0")).toBe(14);
    expect(remPx(token(shared, "--zk-type-prose-size") ?? "0")).toBe(15);
    expect(token(shared, "--zk-body-leading")).toBe("1.55");
  });

  it("keeps label < small < body < card title < h2 step < h1 step", () => {
    const label = remPx(token(shared, "--text-xs") ?? "0");
    const small = remPx(token(shared, "--text-sm") ?? "0");
    const body = remPx(token(shared, "--text-base") ?? "0");
    const cardTitle = remPx(token(shared, "--zk-type-card-title-size") ?? "0");
    const h2Min = remPx("1.375rem");
    const h1Min = remPx("2rem");
    expect(label).toBeLessThan(small);
    expect(small).toBeLessThan(body);
    expect(body).toBeLessThan(cardTitle);
    expect(cardTitle).toBeLessThan(h2Min);
    expect(h2Min).toBeLessThan(h1Min);
    const bodyLeading = Number.parseFloat(token(shared, "--zk-body-leading") ?? "0");
    expect(bodyLeading).toBeGreaterThanOrEqual(1.45);
    expect(bodyLeading).toBeLessThanOrEqual(1.65);
  });

  it("does not let identities override Tailwind text steps or body leading", () => {
    for (const file of identityFiles) {
      const css = read(join("identities", file));
      expect(css).not.toMatch(/^\s*--text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\s*:/m);
      expect(css).not.toMatch(/^\s*--zk-body-leading\s*:/m);
      expect(css).not.toMatch(/^\s*--zk-heading-leading\s*:/m);
    }
  });

  it("fixes Tide semibold at 600, not bold", () => {
    expect(token(read("identities/tide.css"), "--font-weight-semibold")).toBe("600");
  });

  it("clamps identity heading tracking within the P0 spec (|t| ≤ 0.02em)", () => {
    for (const file of identityFiles) {
      const css = read(join("identities", file));
      const track = token(css, "--zk-heading-tracking") ?? "";
      expect(track.length).toBeGreaterThan(0);
      const em = Number.parseFloat(track);
      expect(Number.isFinite(em)).toBe(true);
      expect(Math.abs(em)).toBeLessThanOrEqual(0.02);
    }
  });
});
