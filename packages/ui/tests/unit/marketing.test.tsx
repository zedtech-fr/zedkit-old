import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import * as Marketing from "#marketing/index.js";
import { CtaBand, GlassSurface, Hero } from "#marketing/index.js";
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

describe("Hero", () => {
  it("renders the title as the page heading and labels the section with it", () => {
    render(<Hero title="Keep your shop" description="Add live updates." />);
    const heading = screen.getByRole("heading", { level: 1, name: "Keep your shop" });
    const region = screen.getByRole("region", { name: "Keep your shop" });
    expect(region.getAttribute("data-slot")).toBe("hero");
    expect(region.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(screen.getByText("Add live updates.")).toBeTruthy();
  });

  it("renders eyebrow, actions and media only when given", () => {
    const { rerender, container } = render(<Hero title="T" />);
    expect(container.querySelector("[data-slot='hero-actions']")).toBeNull();
    expect(container.querySelector("[data-slot='hero-media']")).toBeNull();
    rerender(
      <Hero title="T" eyebrow="New" actions={<a href="/signup">Create an account</a>} media={<p>Demo</p>} />,
    );
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeTruthy();
    expect(container.querySelector("[data-slot='hero-media']")?.textContent).toBe("Demo");
  });

  it("uses a level-2 heading when asked, and left-aligns on request", () => {
    const { container } = render(<Hero title="T" headingLevel={2} align="start" />);
    expect(screen.getByRole("heading", { level: 2, name: "T" })).toBeTruthy();
    expect(container.innerHTML).not.toContain("text-center");
  });

  it("gives two heroes distinct heading ids", () => {
    render(
      <>
        <Hero title="One" />
        <Hero title="Two" />
      </>,
    );
    expect(screen.getByRole("heading", { name: "One" }).id).not.toBe(screen.getByRole("heading", { name: "Two" }).id);
  });
});

describe("CtaBand", () => {
  it("renders a labelled region with a level-2 heading and actions", () => {
    render(<CtaBand title="Start today" description="No card needed." actions={<a href="/signup">Create an account</a>} />);
    const region = screen.getByRole("region", { name: "Start today" });
    expect(region.getAttribute("data-slot")).toBe("cta-band");
    expect(screen.getByRole("heading", { level: 2, name: "Start today" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeTruthy();
  });

  it("sits on a tinted glass surface and has no axe violations with Hero", async () => {
    const { container } = render(
      <main>
        <Hero title="Keep your shop" description="Add live updates." actions={<a href="/signup">Create an account</a>} />
        <CtaBand title="Start today" actions={<a href="/signup">Create an account</a>} />
      </main>,
    );
    expect(container.querySelector("[data-slot='cta-band'] [data-slot='glass-surface']")).not.toBeNull();
    for (const node of container.querySelectorAll("[class]")) {
      assertNoValueArbitraries(node.getAttribute("class") ?? "");
    }
    expect((await axe(container)).violations).toEqual([]);
  });
});
