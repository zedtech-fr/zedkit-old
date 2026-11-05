import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StickyAside, StickyAsideAside, StickyAsideMain } from "#index.js";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const css = readFileSync(join(src, "sticky-aside.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("StickyAside", () => {
  it("marks the root, main, and aside with defaults", () => {
    const { container } = render(
      <StickyAside id="layout">
        <StickyAsideMain>Steps</StickyAsideMain>
        <StickyAsideAside>Preview</StickyAsideAside>
      </StickyAside>,
    );
    const root = container.querySelector("[data-sticky-aside]");
    expect(root?.getAttribute("data-side")).toBe("right");
    expect(root?.getAttribute("data-gap")).toBe("md");
    expect(root?.getAttribute("data-from")).toBe("lg");
    expect(root?.getAttribute("data-mobile")).toBe("after");
    expect(root?.hasAttribute("data-scrollable")).toBe(false);
    expect(container.querySelector("[data-sticky-aside-main]")?.textContent).toBe("Steps");
    expect(container.querySelector("[data-sticky-aside-aside]")?.textContent).toBe("Preview");
  });

  it("maps options to attributes", () => {
    const { container } = render(
      <StickyAside
        side="left"
        gap="sm"
        from="md"
        mobile="stack-before"
        scrollable
        ratio="1/3"
        className="p-2 [--zk-sticky-top:7rem]"
      >
        <StickyAside.Main />
        <StickyAside.Aside />
      </StickyAside>,
    );
    const root = container.querySelector<HTMLElement>("[data-sticky-aside]");
    expect(root?.getAttribute("data-side")).toBe("left");
    expect(root?.getAttribute("data-gap")).toBe("sm");
    expect(root?.getAttribute("data-from")).toBe("md");
    expect(root?.getAttribute("data-mobile")).toBe("before");
    expect(root?.hasAttribute("data-scrollable")).toBe(true);
    expect(root?.getAttribute("data-ratio")).toBe("1/3");
    expect(root?.className).toContain("[--zk-sticky-top:7rem]");
    expect(root?.classList.contains("p-2")).toBe(true);
  });

  it("accepts a custom column template on className", () => {
    const { container } = render(
      <StickyAside className="[--zk-sticky-cols:minmax(0,1fr)_min(20rem,40%)]">
        <StickyAsideMain />
        <StickyAsideAside />
      </StickyAside>,
    );
    const root = container.querySelector<HTMLElement>("[data-sticky-aside]");
    expect(root?.getAttribute("data-ratio")).toBeNull();
    expect(root?.className).toContain("[--zk-sticky-cols:");
  });

  it("merges aside styles onto asChild children", () => {
    const { container } = render(
      <StickyAside>
        <StickyAsideMain />
        <StickyAsideAside asChild>
          <div data-testid="surface" className="rounded-xl">
            Card
          </div>
        </StickyAsideAside>
      </StickyAside>,
    );
    const surface = container.querySelector("[data-testid='surface']");
    expect(surface?.getAttribute("data-sticky-aside-aside")).toBe("");
    expect(surface?.classList.contains("rounded-xl")).toBe(true);
  });

  it("renders with renderToStaticMarkup (SSR)", () => {
    const html = renderToStaticMarkup(
      <StickyAside side="right">
        <StickyAsideMain>Main</StickyAsideMain>
        <StickyAsideAside>Aside</StickyAsideAside>
      </StickyAside>,
    );
    expect(html).toContain('data-sticky-aside=""');
    expect(html).toContain("data-sticky-aside-main");
    expect(html).toContain("data-sticky-aside-aside");
  });
});

describe("sticky-aside.css", () => {
  it("sticks the aside only from the chosen breakpoint", () => {
    expect(css).toContain('[data-sticky-aside][data-from="md"]');
    expect(css).toContain('[data-sticky-aside][data-from="lg"]');
    expect(css).toContain("@media (min-width: 48rem)");
    expect(css).toContain("@media (min-width: 64rem)");
    expect(css).toContain("position: sticky");
    expect(css).toContain("top: var(--zk-sticky-top)");
  });

  it("sets anchor scroll margin on the main column", () => {
    expect(css).toContain("[data-sticky-aside-main]");
    expect(css).toContain("scroll-margin-top: var(--zk-pin-top)");
  });

  it("scrollable asides cap height and scroll internally", () => {
    expect(css).toContain("[data-scrollable]");
    expect(css).toContain("max-height: calc(100svh - var(--zk-sticky-top))");
    expect(css).toContain("overflow-y: auto");
  });

  it("prints without sticky positioning", () => {
    const print = css.slice(css.indexOf("@media print"));
    expect(print).toContain("position: static");
  });
});
