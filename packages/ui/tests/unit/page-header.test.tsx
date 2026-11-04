import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "#index.js";

describe("PageHeader", () => {
  it("renders the title as an h1 by default", () => {
    render(<PageHeader title="Projects" />);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeTruthy();
  });

  it("renders an h2 when the page already has an h1", () => {
    render(<PageHeader title="Projects" titleAs="h2" />);
    expect(screen.getByRole("heading", { level: 2, name: "Projects" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("renders a back link above the title, spaced by the back-gap token", () => {
    const { container } = render(<PageHeader title="Projects" back={<a href="/">Back</a>} />);
    const back = container.querySelector('[data-slot="page-header-back"]');
    expect(back?.className).toContain("mb-page-header-back-gap");
    expect(back?.nextElementSibling?.querySelector("h1")).toBeTruthy();
  });
});
