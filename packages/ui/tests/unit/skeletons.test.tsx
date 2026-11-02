import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { CardSkeleton } from "#index.js";
import { DataTableSkeleton } from "#index.js";
import { DetailPanelSkeleton } from "#index.js";
import { PageHeaderSkeleton } from "#index.js";

describe("skeletons", () => {
  it("names each loading zone for assistive tech", () => {
    render(<PageHeaderSkeleton label="Loading report" />);
    expect(screen.getByRole("status", { name: "Loading report" })).not.toBeNull();
  });

  it("defaults the zone label", () => {
    render(<CardSkeleton />);
    expect(screen.getByRole("status", { name: "Loading" })).not.toBeNull();
  });

  it("shares the page-header chrome tokens so content lands without shifting", () => {
    render(<PageHeaderSkeleton label="Loading report" />);
    const root = screen.getByRole("status", { name: "Loading report" });
    expect(root.className).toContain("mb-page-header-offset");
    expect(root.className).toContain("gap-page-header-title-gap");
    expect(root.className).not.toMatch(/(^|\s)mb-6(\s|$)/);
    expect(root.querySelector(".gap-2")).not.toBeNull();
    expect(root.innerHTML).not.toContain("gap-page-header-actions-gap");
  });

  it("shares the card spacing tokens so content lands without shifting", () => {
    render(<CardSkeleton />);
    const zone = screen.getByRole("status");
    expect(zone.className).toContain("p-card-padding");
    expect(zone.className).toContain("shadow-md");
    expect(zone.className).not.toMatch(/(^|\s)shadow(\s|$)/);
    expect(zone.querySelector(".space-y-card-stack")).not.toBeNull();
    expect(zone.querySelector(".mt-4.space-y-2")).not.toBeNull();
    expect(zone.innerHTML).not.toContain("space-y-card-lines");
  });

  it("sizes the table skeleton to its columns and rows", () => {
    const { container } = render(<DataTableSkeleton columns={3} rows={2} />);
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
    expect(container.querySelectorAll("thead th").length).toBe(3);
  });

  it("sizes the detail skeleton to its rows", () => {
    render(<DetailPanelSkeleton rows={5} />);
    expect(screen.getByRole("status").childElementCount).toBe(5);
  });

  it("hides optional header blocks when asked", () => {
    const { container } = render(<PageHeaderSkeleton description={false} actions={false} />);
    expect(container.querySelectorAll(".bg-muted").length).toBe(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <PageHeaderSkeleton />
        <CardSkeleton />
        <DataTableSkeleton />
        <DetailPanelSkeleton />
      </>,
    );
    const results = await axe(container, {
      rules: {
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
        "document-title": { enabled: false },
        "html-has-lang": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
