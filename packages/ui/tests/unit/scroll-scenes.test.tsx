import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SCROLL_SCENES_MAX, ScrollScenes } from "#index.js";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const css = readFileSync(join(src, "scroll-scenes.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const scenes = [
  { id: "one", caption: <h3>First</h3>, children: <p>Alpha</p> },
  { id: "two", caption: <h3>Second</h3>, children: <p>Beta</p> },
  { id: "three", caption: <h3>Third</h3>, children: <p>Gamma</p> },
];

describe("ScrollScenes", () => {
  it("renders every scene in order with its caption and visual", () => {
    const { container } = render(<ScrollScenes scenes={scenes} />);
    const articles = [...container.querySelectorAll("[data-scroll-scene]")];
    expect(articles.map((el) => el.getAttribute("data-scroll-scene"))).toEqual(["one", "two", "three"]);
    expect(screen.getAllByRole("heading").map((el) => el.textContent)).toEqual(["First", "Second", "Third"]);
    expect(screen.getByText("Gamma")).toBeTruthy();
  });

  it("tells the CSS the scene count, for two to eight scenes", () => {
    const { container, rerender } = render(<ScrollScenes scenes={scenes} />);
    expect(container.querySelector("[data-scroll-scenes]")?.getAttribute("data-scene-count")).toBe("3");
    rerender(<ScrollScenes scenes={scenes.slice(0, 2)} />);
    expect(container.querySelector("[data-scroll-scenes]")?.getAttribute("data-scene-count")).toBe("2");
  });

  it("stays stacked (no pinned stage) for a single scene or more than eight", () => {
    const many = Array.from({ length: SCROLL_SCENES_MAX + 1 }, (_, index) => ({
      id: `s${index}`,
      caption: <h3>{`Scene ${index}`}</h3>,
      children: <p>Body</p>,
    }));
    const { container, rerender } = render(<ScrollScenes scenes={many} />);
    expect(container.querySelector("[data-scene-count]")).toBeNull();
    expect(container.querySelectorAll("[data-scroll-scene]").length).toBe(SCROLL_SCENES_MAX + 1);
    rerender(<ScrollScenes scenes={scenes.slice(0, 1)} />);
    expect(container.querySelector("[data-scene-count]")).toBeNull();
  });

  it("keeps the caller's className and props on the track", () => {
    const { container } = render(<ScrollScenes scenes={scenes} className="min-w-0 p-2" id="tour" aria-label="Tour" />);
    const track = container.querySelector<HTMLElement>("[data-scroll-scenes]");
    expect(track?.classList.contains("p-2")).toBe(true);
    expect(track?.id).toBe("tour");
    expect(track?.getAttribute("aria-label")).toBe("Tour");
  });

  it("hides only the decorative progress rail from assistive tech, never a caption", () => {
    const { container } = render(<ScrollScenes scenes={scenes} />);
    const rail = container.querySelector("[data-scroll-scenes-progress]");
    expect(rail?.getAttribute("aria-hidden")).toBe("true");
    expect(rail?.querySelectorAll("li").length).toBe(3);
    for (const caption of container.querySelectorAll("[data-scroll-scene-caption]")) {
      expect(caption.closest("[aria-hidden]")).toBeNull();
    }
  });
});

describe("scroll-scenes.css", () => {
  it("pins and animates only with scroll timelines, allowed motion and room for a stage", () => {
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(block).toContain("(min-height: 34rem)");
    expect(block).toContain("@supports (animation-timeline: view())");
    // Everything that pins or animates is inside that block; before it only the hidden rail.
    const before = css.slice(0, css.indexOf("@media (prefers-reduced-motion: no-preference)"));
    expect(before).not.toMatch(/position:\s*sticky|animation-timeline|view-timeline/);
  });

  it("hides scenes with opacity only, so their text stays readable by assistive tech", () => {
    expect(css).not.toMatch(/visibility:\s*hidden/);
    const keyframes = css.slice(css.indexOf("@keyframes zk-scene-fade"));
    expect(keyframes).not.toContain("visibility");
    expect(keyframes).not.toContain("display");
  });

  it("writes the pinned timing for every supported scene count", () => {
    for (let count = 2; count <= SCROLL_SCENES_MAX; count++) {
      expect(css).toContain(`[data-scene-count="${count}"]`);
      expect(css).toContain(`:nth-of-type(${count})`);
    }
    expect(css).not.toContain(`[data-scene-count="${SCROLL_SCENES_MAX + 1}"]`);
  });

  it("measures the stage in small-viewport units so a collapsing phone toolbar does not move it", () => {
    expect(css).toContain("100svh");
    expect(css).not.toMatch(/\b100vh\b/);
  });

  it("keeps scene fades free of layout-moving properties", () => {
    const keyframes = css.slice(css.indexOf("@keyframes zk-scene-fade"), css.indexOf("@keyframes zk-scene-dot"));
    expect(keyframes).not.toMatch(/\b(top|left|margin|padding|height|width)\s*:/);
  });

  it("fades scenes with opacity alone: a transform-like animation would capture position: fixed descendants", () => {
    const keyframes = css.slice(css.indexOf("@keyframes zk-scene-fade"), css.indexOf("@keyframes zk-scene-dot"));
    const properties = new Set([...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1]));
    // The browser-level proof (a toast in the held hero scene stays in the viewport) lives in the docs e2e suite.
    expect([...properties]).toEqual(["opacity"]);
  });
});
