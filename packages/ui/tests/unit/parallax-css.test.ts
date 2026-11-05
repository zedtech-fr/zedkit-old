import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const css = readFileSync(join(src, "parallax.css"), "utf8");
const body = css.replace(/\/\*[\s\S]*?\*\//g, "");

function keyframeBodies(source: string): string[] {
  const bodies: string[] = [];
  const re = /@keyframes\s+[\w-]+\s*\{/g;
  let match = re.exec(source);
  while (match) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    bodies.push(source.slice(re.lastIndex, i - 1));
    match = re.exec(source);
  }
  return bodies;
}

describe("parallax CSS contract (AC 9.1, 9.9)", () => {
  it("is imported by the kit stylesheet and the motion.css export", () => {
    const styles = readFileSync(join(src, "styles.css"), "utf8");
    const kit = readFileSync(join(src, "motion-kit.css"), "utf8");
    expect(styles).toContain('@import "./parallax.css"');
    expect(kit).toContain('@import "./parallax.css"');
  });

  it("animates only translate, scale, and opacity", () => {
    for (const block of keyframeBodies(body)) {
      const props = [...block.matchAll(/^\s*([a-z-]+)\s*:/gim)].map((row) => row[1]!.toLowerCase());
      expect(props.every((prop) => ["translate", "scale", "opacity"].includes(prop))).toBe(true);
    }
    expect(body).not.toMatch(/will-change/);
    expect(body).not.toMatch(/\bblur\s*\(/);
    expect(body).not.toMatch(/\brotate\b/);
  });

  it("gates motion with no-preference, the in-app toggle, and view() support", () => {
    const support = body.indexOf("@supports (animation-timeline: view())");
    const gate = body.indexOf(':root:not([data-motion="reduce"])');
    const prefer = body.indexOf("@media (prefers-reduced-motion: no-preference)");
    const firstAnim = body.indexOf("animation-name:");
    expect(prefer).toBeGreaterThan(-1);
    expect(support).toBeGreaterThan(prefer);
    expect(gate).toBeGreaterThan(support);
    expect(firstAnim).toBeGreaterThan(gate);
  });

  it("keeps Firefox without scroll timelines static (no animation outside @supports)", () => {
    const support = body.indexOf("@supports (animation-timeline: view())");
    const before = body.slice(0, support);
    expect(before).not.toMatch(/animation-name:/);
    expect(before).not.toMatch(/animation-timeline:/);
    expect(body).toContain("@media print");
  });

  it("clips the section, never overflow hidden, and shares a view timeline", () => {
    expect(body).toContain("overflow: clip");
    expect(body).not.toMatch(/overflow:\s*hidden/);
    expect(body).toContain("isolation: isolate");
    expect(body).toContain("view-timeline-name: --zk-tl");
    expect(body).toContain("animation-timeline: scroll()");
    expect(body).toContain("[data-parallax-move]:not([data-parallax] *)");
  });

  it("uses runtime knobs as var(--zk-…, fallback)", () => {
    expect(body).toContain("var(--zk-motion-intensity, 1)");
    expect(body).toContain("var(--zk-motion-mobile, 1)");
    expect(body).toContain(
      "min(calc(var(--zk-reveal-distance, 0.75rem) * 8), var(--zk-parallax-max-shift, 120px))",
    );
  });

  it("disables snap on sections that contain a parallax root", () => {
    const scroll = readFileSync(join(src, "section-scroll.css"), "utf8");
    expect(scroll).toContain("[data-parallax]");
  });
});
