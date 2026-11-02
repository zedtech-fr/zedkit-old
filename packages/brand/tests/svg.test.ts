import { describe, expect, it } from "vitest";
import {
  BRAND_INK,
  BRAND_PAPER,
  logoAsset,
  logoGeometry,
  logoSvg,
  type LogoAssetKind,
  type LogoTheme,
  type LogoVariant,
} from "#index.js";

const variants: LogoVariant[] = ["mark", "wordmark", "lockup"];
const themes: LogoTheme[] = ["on-light", "on-dark", "current", "auto"];
const kinds: LogoAssetKind[] = ["favicon", "apple-touch", "og"];

function parse(svg: string): Document {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(doc.querySelector("parsererror")).toBeNull();
  return doc;
}

describe("logoGeometry", () => {
  it("has a viewBox that matches its width and height", () => {
    for (const variant of variants) {
      const { viewBox, width, height } = logoGeometry(variant);
      const [, , w, h] = viewBox.split(" ").map(Number);
      expect(w).toBeCloseTo(width, 1);
      expect(h).toBeCloseTo(height, 1);
    }
  });

  it("builds the lockup from the mark and the wordmark", () => {
    const mark = logoGeometry("mark").shapes;
    const word = logoGeometry("wordmark").shapes;
    const lockup = logoGeometry("lockup").shapes;
    expect(lockup.map((s) => s.d)).toEqual([...mark, ...word].map((s) => s.d));
    expect(lockup.at(-1)?.transform).toMatch(/^translate\(.+\) scale\(.+\)$/);
  });

  it("keeps the lockup wider than the mark and as tall", () => {
    const mark = logoGeometry("mark");
    const lockup = logoGeometry("lockup");
    expect(lockup.width).toBeGreaterThan(mark.width * 2);
    expect(lockup.height).toBe(mark.height);
  });
});

describe("logoSvg", () => {
  it("is well-formed XML for every variant and theme", () => {
    for (const variant of variants) {
      for (const theme of themes) {
        const doc = parse(logoSvg({ variant, theme }));
        expect(doc.documentElement.getAttribute("viewBox")).toBe(logoGeometry(variant).viewBox);
      }
    }
  });

  it("defaults to the current-colour lockup named zedkit", () => {
    const doc = parse(logoSvg());
    expect(doc.documentElement.getAttribute("viewBox")).toBe(logoGeometry("lockup").viewBox);
    expect(doc.documentElement.getAttribute("aria-label")).toBe("zedkit");
    expect(doc.querySelector("title")?.textContent).toBe("zedkit");
    expect(doc.querySelector("g")?.getAttribute("fill")).toBe("currentColor");
  });

  it("pins the brand colours for light and dark surfaces", () => {
    expect(parse(logoSvg({ theme: "on-light" })).querySelector("g")?.getAttribute("fill")).toBe(BRAND_INK);
    expect(parse(logoSvg({ theme: "on-dark" })).querySelector("g")?.getAttribute("fill")).toBe(BRAND_PAPER);
  });

  it("switches with the colour scheme when asked for auto", () => {
    const svg = logoSvg({ theme: "auto", variant: "mark" });
    expect(svg).toContain("prefers-color-scheme:dark");
    expect(svg).toContain(BRAND_INK);
    expect(svg).toContain(BRAND_PAPER);
    expect(svg).toContain('class="zedkit-logo"');
  });

  it("marks the SVG decorative with an empty title", () => {
    const doc = parse(logoSvg({ title: "" }));
    expect(doc.documentElement.getAttribute("aria-hidden")).toBe("true");
    expect(doc.documentElement.getAttribute("role")).toBeNull();
    expect(doc.querySelector("title")).toBeNull();
  });

  it("escapes the title", () => {
    const doc = parse(logoSvg({ title: `A & "B" <c>` }));
    expect(doc.querySelector("title")?.textContent).toBe(`A & "B" <c>`);
  });

  it("is deterministic", () => {
    expect(logoSvg({ variant: "mark", theme: "on-dark" })).toBe(logoSvg({ variant: "mark", theme: "on-dark" }));
  });
});

describe("logoAsset", () => {
  it("is well-formed XML at the documented size", () => {
    const sizes: Record<LogoAssetKind, readonly [number, number]> = { favicon: [640, 480], "apple-touch": [180, 180], og: [1200, 630] };
    for (const kind of kinds) {
      const asset = logoAsset(kind);
      const doc = parse(asset.svg);
      expect([asset.width, asset.height]).toEqual(sizes[kind]);
      expect(doc.documentElement.getAttribute("viewBox")).toBe(`0 0 ${asset.width} ${asset.height}`);
    }
  });

  it("keeps the favicon transparent and theme-aware", () => {
    const { svg } = logoAsset("favicon");
    expect(svg).not.toContain("<rect");
    expect(svg).toContain("prefers-color-scheme:dark");
  });

  it("gives apple-touch and og an opaque ink background and a paper logo", () => {
    for (const kind of ["apple-touch", "og"] as const) {
      const doc = parse(logoAsset(kind).svg);
      expect(doc.querySelector("rect")?.getAttribute("fill")).toBe(BRAND_INK);
      expect(doc.querySelector("g g")?.getAttribute("fill")).toBe(BRAND_PAPER);
    }
  });

  it("centres the artwork on the canvas", () => {
    for (const kind of ["apple-touch", "og"] as const) {
      const asset = logoAsset(kind);
      const transform = /<g transform="translate\(([\d.-]+) ([\d.-]+)\) scale\(([\d.]+)\)">/.exec(asset.svg);
      expect(transform).not.toBeNull();
      const [, x, y, scale] = transform!.map(Number);
      const variant = kind === "og" ? "lockup" : "mark";
      const { viewBox, width, height } = logoGeometry(variant);
      const [vx, vy] = viewBox.split(" ").map(Number);
      const left = x! + vx! * scale!;
      const top = y! + vy! * scale!;
      expect(left).toBeGreaterThan(0);
      expect(top).toBeGreaterThan(0);
      expect(left + width * scale!).toBeCloseTo(asset.width - left, 0);
      expect(top + height * scale!).toBeCloseTo(asset.height - top, 0);
    }
  });
});
