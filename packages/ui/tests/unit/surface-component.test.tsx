import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Surface,
  WidgetButton,
} from "#index.js";

describe("Surface", () => {
  it("tags glass variant for frosted CSS", () => {
    render(
      <Surface variant="glass" elevation={3} data-testid="panel">
        Frost
      </Surface>,
    );
    const panel = screen.getByTestId("panel");
    expect(panel.getAttribute("data-surface")).toBe("glass");
    expect(panel.className).toContain("shadow-overlay");
  });

  it("renders solid card elevation without glass hook", () => {
    render(<Surface variant="solid" elevation={2} radius="xl" data-testid="card" />);
    const panel = screen.getByTestId("card");
    expect(panel.getAttribute("data-surface")).toBeNull();
    expect(panel.className).toContain("bg-card");
    expect(panel.className).toContain("shadow-md");
    expect(panel.className).toContain("rounded-xl");
  });
});

describe("Surface composition", () => {
  it("Card uses surface tokens", () => {
    render(<Card data-testid="card">Body</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("shadow-md");
    expect(card.className).toContain("rounded-xl");
  });

  it("WidgetButton exposes the widget slot", () => {
    render(<WidgetButton>Ask</WidgetButton>);
    const button = screen.getByRole("button", { name: "Ask" });
    expect(button.getAttribute("data-slot")).toBe("widget-button");
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("shadow-md");
  });

  it("Popover content uses popover surface", () => {
    render(
      <Popover open>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent data-testid="popover">Menu</PopoverContent>
      </Popover>,
    );
    const panel = screen.getByTestId("popover");
    expect(panel.className).toContain("bg-popover");
    expect(panel.className).toContain("shadow-md");
  });

  it("Dialog content uses overlay elevation", () => {
    render(
      <Dialog open>
        <DialogContent data-testid="dialog">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const panel = screen.getByTestId("dialog");
    expect(panel.className).toContain("shadow-overlay");
    expect(panel.className).toContain("bg-card");
  });
});
