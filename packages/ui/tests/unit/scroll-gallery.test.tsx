import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScrollGallery } from "#index.js";

const stylesCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../src/styles.css"), "utf8");

describe("ScrollGallery", () => {
  it("marks the scroll region for styling", () => {
    render(
      <ScrollGallery aria-label="Examples">
        <button type="button">One</button>
      </ScrollGallery>,
    );
    expect(screen.getByRole("button", { name: "One" }).parentElement?.getAttribute("data-scroll-gallery-track")).toBe("");
    expect(screen.getByLabelText("Examples").getAttribute("data-slot")).toBe("scroll-gallery");
  });

  it("keeps track spacing and non-shrinking snap peers in styles.css", () => {
    expect(stylesCss).toMatch(
      /\[data-slot="scroll-gallery"\] \[data-scroll-gallery-track\][\s\S]*gap: var\(--zk-gap-md\)/,
    );
    expect(stylesCss).toMatch(
      /\[data-slot="scroll-gallery"\] \[data-slot="tabs-list"\][\s\S]*gap: var\(--zk-gap-md\)/,
    );
    expect(stylesCss).toMatch(
      /\[data-scroll-gallery-track\][\s\S]*padding-inline-start: calc\(var\(--zk-table-fade\) \+ var\(--zk-gap-sm\)\)/,
    );
    expect(stylesCss).toMatch(
      /\[data-slot="tabs-trigger"\]:has\(\[data-tab-label\]\)[\s\S]*flex-direction: column/,
    );
    expect(stylesCss).toMatch(
      /\[data-scroll-gallery-track\] > \*[\s\S]*flex-shrink: 0[\s\S]*scroll-snap-align: start/,
    );
    expect(stylesCss).toMatch(
      /\[data-slot="scroll-gallery"\] \[data-slot="tabs-trigger"\]:has\(\[data-tab-label\]\)[\s\S]*white-space: normal/,
    );
  });
});
