import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import * as Marketing from "#marketing/index.js";
import { GlassSurface } from "#marketing/index.js";
import { assertNoValueArbitraries } from "./no-arbitraries.js";

describe("marketing entry", () => {
  const components = Object.entries(Marketing).filter(
    ([name, value]) => typeof value === "function" && /^[A-Z]/.test(name),
  );

  it.each(components)("%s source includes data-slot", (_name, value) => {
    expect(Function.prototype.toString.call(value)).toContain("data-slot");
  });
});

describe("GlassSurface", () => {
  it("renders children on the card colour so the glass identity applies", () => {
    render(<GlassSurface>Hello</GlassSurface>);
    const node = screen.getByText("Hello");
    expect(node.getAttribute("data-slot")).toBe("glass-surface");
    expect(node.className).toContain("bg-card");
    expect(node.className).toContain("p-6");
  });

  it("switches tone and padding", () => {
    render(
      <GlassSurface tone="tinted" padding="lg">
        Tinted
      </GlassSurface>,
    );
    const node = screen.getByText("Tinted");
    expect(node.className).toContain("from-accent/15");
    expect(node.className).toContain("p-8");
    expect(node.className).not.toContain("p-6");
  });

  it("renders the requested element and forwards props", () => {
    render(
      <GlassSurface as="section" aria-label="Plans" className="mt-4">
        Plans
      </GlassSurface>,
    );
    const node = screen.getByLabelText("Plans");
    expect(node.tagName).toBe("SECTION");
    expect(node.className).toContain("mt-4");
  });

  it("uses no raw arbitrary values and has no axe violations", async () => {
    const { container } = render(
      <>
        <GlassSurface tone="plain">A</GlassSurface>
        <GlassSurface tone="raised">B</GlassSurface>
        <GlassSurface tone="tinted">C</GlassSurface>
      </>,
    );
    for (const node of container.querySelectorAll("[data-slot='glass-surface']")) {
      assertNoValueArbitraries(node.className);
    }
    expect((await axe(container)).violations).toEqual([]);
  });
});
