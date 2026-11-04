import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

describe("signature motion tokens", () => {
  const css = read("signature-motion.css");

  it("names five motions with duration tokens", () => {
    for (const name of ["reveal", "settle", "emphasis", "glide", "feedback"]) {
      expect(css).toContain(`--zk-motion-${name}-duration`);
    }
  });

  it("exports motion-* utilities wired to kit keyframes", () => {
    expect(css).toContain("@utility motion-reveal");
    expect(css).toContain("zk-reveal-up");
    expect(css).toContain("@utility motion-settle");
    expect(css).toContain("zk-reveal-fade");
    expect(css).toContain("@utility motion-emphasis");
    expect(css).toContain("zk-reveal-pop");
  });
});

describe("type role utilities", () => {
  const css = read("type-roles.css");

  it("maps display/section/band roles to h1–h3 tokens", () => {
    expect(css).toContain("text-zk-type-display");
    expect(css).toContain("--zk-type-h1-size");
    expect(css).toContain("text-zk-type-section");
    expect(css).toContain("--zk-type-h2-size");
    expect(css).toContain("text-zk-type-band");
    expect(css).toContain("--zk-type-h3-size");
  });
});

describe("section scroll", () => {
  const css = read("section-scroll.css");

  it("uses proximity snap, never mandatory, behind reduced-motion", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("scroll-behavior: smooth");
    expect(css).toContain("scroll-padding-top: var(--zk-header-height)");
    expect(css).toContain("scroll-snap-type: y proximity");
    expect(css).not.toContain("mandatory");
    expect(css).toContain('data-snap="none"');
  });
});
