import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScrollGallery } from "#index.js";

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
});
