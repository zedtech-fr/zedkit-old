import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { logoGeometry, logoSvg } from "#index.js";
import { ZedkitLogo } from "#react.js";

describe("ZedkitLogo", () => {
  afterEach(cleanup);

  it("renders the lockup with an accessible name by default", () => {
    const { getByRole } = render(<ZedkitLogo />);
    const svg = getByRole("img", { name: "zedkit" });
    expect(svg.getAttribute("viewBox")).toBe(logoGeometry("lockup").viewBox);
    expect(svg.getAttribute("height")).toBe("1.5em");
    expect(svg.querySelector("g")?.getAttribute("fill")).toBe("currentColor");
  });

  it("is hidden from assistive tech with an empty title", () => {
    const { container, queryByRole } = render(<ZedkitLogo title="" variant="mark" />);
    expect(queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("title")).toBeNull();
  });

  it("lets the caller size and style it", () => {
    const { container } = render(<ZedkitLogo className="h-6" height={40} id="brand" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toBe("h-6");
    expect(svg?.getAttribute("height")).toBe("40");
    expect(svg?.id).toBe("brand");
  });

  it("draws the same shapes as the string builder", () => {
    for (const variant of ["mark", "wordmark", "lockup"] as const) {
      for (const theme of ["on-light", "on-dark", "current"] as const) {
        const { container } = render(<ZedkitLogo variant={variant} theme={theme} />);
        const fromReact = Array.from(container.querySelectorAll("path")).map((p) => p.getAttribute("d"));
        const doc = new DOMParser().parseFromString(logoSvg({ variant, theme }), "image/svg+xml");
        const fromString = Array.from(doc.querySelectorAll("path")).map((p) => p.getAttribute("d"));
        expect(fromReact).toEqual(fromString);
        expect(container.querySelector("g")?.getAttribute("fill")).toBe(doc.querySelector("g")?.getAttribute("fill"));
      }
    }
  });
});
