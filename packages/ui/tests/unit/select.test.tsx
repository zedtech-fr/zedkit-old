import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RegionSelect, stubSelectJsdom } from "./select-fixture.js";
import { assertNoValueArbitraries } from "./no-arbitraries.js";

beforeAll(() => {
  stubSelectJsdom();
});

describe("select", () => {
  it("opens, picks an option, and reports the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSelect onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await user.click(await screen.findByRole("option", { name: "Europe" }));

    expect(onChange).toHaveBeenCalledWith("eu");
    expect(screen.getByRole("combobox", { name: "Region" }).textContent).toContain("Europe");
  });

  it("stacks the open content on the dropdown z-index token", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.className).toContain("z-dropdown");
    expect(listbox.className).not.toContain("z-overlay");
    expect(listbox.className).not.toContain("z-50");
  });

  it("sizes the trigger from control tokens with a token focus ring", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);

    const trigger = screen.getByRole("combobox", { name: "Region" });
    for (const token of ["h-control-height", "px-3", "py-2", "focus-ring-control", "text-control"]) {
      expect(trigger.className).toContain(token);
    }
    expect(trigger.className).not.toContain("px-control-inline");
    expect(trigger.className).not.toContain("py-control-block-lg");
    expect(trigger.className).not.toMatch(/(^|\s)h-9(\s|$)/);
    expect(trigger.className).not.toContain("focus:ring-1");
    expect(trigger.querySelector("svg")?.classList.contains("size-4")).toBe(true);
    expect(trigger.querySelector("svg")?.className).not.toContain("size-icon-control");
    await user.click(trigger);
    await screen.findByRole("listbox");
  });

  it("styles label, item, and indicator from item tokens", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const option = await screen.findByRole("option", { name: "Europe" });
    for (const token of ["py-1.5", "pr-select-item-indicator-gap", "pl-2"]) {
      expect(option.className).toContain(token);
    }
    expect(option.className).not.toContain("py-select-item-block");
    expect(option.className).not.toContain("pl-select-item-inline");
    expect(option.className).not.toMatch(/(^|\s)pr-8(\s|$)/);
    const indicator = option.querySelector("span.absolute");
    expect(indicator?.className).toContain("size-icon-sm");
    expect(indicator?.className).toContain("right-2");
    expect(indicator?.className).not.toContain("right-select-item-inline");
    const label = screen.getByText("Regions");
    expect(label.className).toContain("px-2");
    expect(label.className).toContain("py-1.5");
    expect(label.className).not.toContain("px-select-item-inline");
    expect(label.className).not.toContain("py-select-item-block");
  });

  it("styles viewport padding and popper offsets from tokens", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.className).toContain("translate-y-select-separator");
    expect(listbox.querySelector("[data-radix-select-viewport]")?.className).toContain("p-select-separator");
  });

  it("sizes content min-width from the container token", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.className).toContain("min-w-select-content-min");
    expect(listbox.className).not.toContain("min-w-[8rem]");
  });

  it("carries no value arbitraries on trigger, content, or items", async () => {
    const user = userEvent.setup();
    render(<RegionSelect />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    await user.click(trigger);
    const listbox = await screen.findByRole("listbox");
    const option = screen.getByRole("option", { name: "Europe" });
    for (const className of [trigger.className, listbox.className, option.className]) {
      assertNoValueArbitraries(className);
    }
  });

  it("shows a disabled message and reports nothing when there are no options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSelect regions={[]} onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const message = await screen.findByRole("option", { name: "No regions available" });
    expect(message.hasAttribute("data-disabled")).toBe(true);
    await user.click(message);
    expect(onChange).not.toHaveBeenCalled();
  });
});
