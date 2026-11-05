import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Surface } from "#index.js";
import { ParallaxLayer, ParallaxSection } from "#motion/index.js";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");

describe("ParallaxSection", () => {
  it("writes axis, range, off, and intensity as attributes and CSS variables", () => {
    const { container } = render(
      <ParallaxSection axis="x" range="page" off="below-md" intensity={0.3} inset="2rem" preset="hero-depth">
        Copy
      </ParallaxSection>,
    );
    const root = container.querySelector<HTMLElement>("[data-parallax]");
    expect(root?.tagName).toBe("SECTION");
    expect(root?.getAttribute("data-parallax-axis")).toBe("x");
    expect(root?.getAttribute("data-parallax-range")).toBe("page");
    expect(root?.getAttribute("data-parallax-off")).toBe("below-md");
    expect(root?.getAttribute("data-parallax-preset")).toBe("hero-depth");
    expect(root?.className).toContain("[--zk-motion-intensity:0.3]");
    expect(root?.className).toContain("[--zk-parallax-inset:2rem]");
  });

  it("renders with renderToStaticMarkup (RSC / SSR)", () => {
    const html = renderToStaticMarkup(
      <ParallaxSection range="cover">
        <ParallaxLayer depth="far" />
      </ParallaxSection>,
    );
    expect(html).toContain("data-parallax=\"\"");
    expect(html).toContain("data-parallax-layer");
    expect(html).toContain("data-parallax-depth=\"far\"");
  });
});

describe("ParallaxLayer", () => {
  it("keeps depth 0 still: no move flag, no aria-hidden", () => {
    const { container } = render(<ParallaxLayer depth={0}>Title</ParallaxLayer>);
    const layer = container.querySelector("[data-parallax-layer]");
    expect(layer?.getAttribute("data-parallax-depth")).toBe("0");
    expect(layer?.hasAttribute("data-parallax-move")).toBe(false);
    expect(layer?.getAttribute("aria-hidden")).toBeNull();
    expect(layer?.hasAttribute("inert")).toBe(false);
  });

  it("marks a moving layer decorative", () => {
    const { container } = render(<ParallaxLayer depth="near" name="deco" />);
    const layer = container.querySelector("[data-parallax-layer]");
    expect(layer?.getAttribute("data-parallax-layer")).toBe("deco");
    expect(layer?.getAttribute("data-parallax-depth")).toBe("near");
    expect(layer?.hasAttribute("data-parallax-move")).toBe(true);
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(layer?.hasAttribute("inert")).toBe(true);
  });

  it("writes a numeric depth as a CSS variable and skip-translates when fading", () => {
    const { container } = render(<ParallaxLayer depth={0.25} fade="entry" zoom={[1, 1.08]} />);
    const layer = container.querySelector<HTMLElement>("[data-parallax-layer]");
    expect(layer?.hasAttribute("data-parallax-move")).toBe(false);
    expect(layer?.getAttribute("data-parallax-fade")).toBe("entry");
    expect(layer?.hasAttribute("data-parallax-zoom")).toBe(true);
    expect(layer?.className).toContain("[--zk-depth:0.25]");
    expect(layer?.className).toContain("[--zk-zoom-from:1]");
    expect(layer?.className).toContain("[--zk-zoom-to:1.08]");
  });
});

describe("Surface depth", () => {
  it("wraps the surface in a ParallaxLayer without hiding it", () => {
    const { container } = render(
      <Surface depth="back" layerClassName="absolute inset-0" padding="md">
        Mock
      </Surface>,
    );
    const layer = container.querySelector("[data-parallax-layer]");
    const surface = container.querySelector("[data-slot='surface']");
    expect(layer?.contains(surface)).toBe(true);
    expect(layer?.className).toContain("absolute");
    expect(layer?.getAttribute("aria-hidden")).toBeNull();
    expect(surface?.textContent).toBe("Mock");
  });

  it("does not wrap a still surface", () => {
    const { container } = render(<Surface depth={0}>Still</Surface>);
    expect(container.querySelector("[data-parallax-layer]")).toBeNull();
    expect(container.querySelector("[data-slot='surface']")?.textContent).toBe("Still");
  });
});

describe("motion public API", () => {
  it("does not leak third-party library names from the motion entry", () => {
    const files = ["motion/index.ts", "motion/runtime.ts", "parallax.tsx", "parallax-types.ts"];
    for (const file of files) {
      const text = readFileSync(join(src, file), "utf8");
      expect(text).not.toMatch(/\b(framer-motion|animejs|from ["']motion["'])\b/);
    }
  });
});

function typeContractChecks(): void {
  const ok: import("#surface.js").SurfaceProps = { depth: "back", variant: "solid" };
  void ok;
  const glass: import("#surface.js").SurfaceProps = { variant: "glass" };
  void glass;
  // @ts-expect-error -- depth is forbidden on glass
  const bad: import("#surface.js").SurfaceProps = { variant: "glass", depth: "back" };
  void bad;
}

describe("Surface depth types", () => {
  it("is enforced by the package typecheck job", () => {
    expect(typeContractChecks.name).toBe("typeContractChecks");
  });
});
