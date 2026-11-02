import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Checkbox, Label, Switch } from "#index.js";

describe("toggles", () => {
  it("checks and unchecks a labeled checkbox", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept the terms</Label>
      </>,
    );
    const box = screen.getByRole("checkbox", { name: "Accept the terms" });
    expect(box.getAttribute("data-state")).toBe("unchecked");
    await user.click(box);
    expect(box.getAttribute("data-state")).toBe("checked");
    await user.click(box);
    expect(box.getAttribute("data-state")).toBe("unchecked");
  });

  it("styles the checkbox from design tokens", () => {
    render(<Checkbox aria-label="Accept the terms" defaultChecked />);
    const box = screen.getByRole("checkbox", { name: "Accept the terms" });
    expect(box.classList.contains("size-4")).toBe(true);
    expect(box.classList.contains("focus-ring-control")).toBe(true);
    expect(box.className).not.toMatch(/(^|\s)(h-4|w-4|ring-1)(\s|$)/);
    const icon = box.querySelector("svg");
    expect(icon?.classList.contains("size-4")).toBe(true);
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("flips a labeled switch", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="notify" />
        <Label htmlFor="notify">Notify me</Label>
      </>,
    );
    const toggle = screen.getByRole("switch", { name: "Notify me" });
    expect(toggle.getAttribute("data-state")).toBe("unchecked");
    await user.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("checked");
  });

  it("styles the switch from spacing-derived geometry", () => {
    render(<Switch aria-label="Notify me" defaultChecked />);
    const toggle = screen.getByRole("switch", { name: "Notify me" });
    expect(toggle.className).toContain("calc(var(--spacing)");
    expect(toggle.classList.contains("hit-target")).toBe(true);
    expect(toggle.classList.contains("focus-ring")).toBe(true);
    expect(toggle.className).not.toContain("w-switch-track-width");
    const thumb = toggle.querySelector("span");
    expect(thumb?.className).toContain("calc(var(--spacing)");
    expect(thumb?.className).not.toContain("translate-x-4");
  });
});
