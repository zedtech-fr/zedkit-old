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
  it("Card composes Surface as the host", () => {
    expect(Function.prototype.toString.call(Card)).toContain("Surface");
    render(<Card data-testid="card">Body</Card>);
    const card = screen.getByTestId("card");
    expect(card.getAttribute("data-slot")).toBe("card");
    expect(card.className).toContain("bg-card");
    expect(card.className).toContain("shadow-md");
    expect(card.className).toContain("rounded-xl");
  });

  it("WidgetButton composes surfaceVariants on the button host", () => {
    expect(Function.prototype.toString.call(WidgetButton)).toContain("surfaceVariants");
    render(<WidgetButton>Ask</WidgetButton>);
    const button = screen.getByRole("button", { name: "Ask" });
    expect(button.getAttribute("data-slot")).toBe("widget-button");
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("shadow-md");
    expect(button.className).toContain("bg-card");
  });

  it("Popover content composes Surface as the panel", () => {
    expect(Function.prototype.toString.call(PopoverContent)).toContain("Surface");
    render(
      <Popover open>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent data-testid="popover">Menu</PopoverContent>
      </Popover>,
    );
    const panel = screen.getByTestId("popover");
    expect(panel.getAttribute("data-slot")).toBe("popover-content");
    expect(panel.className).toContain("bg-popover");
    expect(panel.className).toContain("shadow-md");
  });

  it("Dialog content composes Surface as the panel", () => {
    expect(Function.prototype.toString.call(DialogContent)).toContain("Surface");
    render(
      <Dialog open>
        <DialogContent data-testid="dialog">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const panel = screen.getByTestId("dialog");
    expect(panel.getAttribute("data-slot")).toBe("dialog-content");
    expect(panel.className).toContain("shadow-overlay");
    expect(panel.className).toContain("bg-card");
  });
});
