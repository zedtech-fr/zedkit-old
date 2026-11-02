import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OptionCard, OptionCards, Wizard, WizardStep, WizardSteps } from "#index.js";

describe("WizardSteps", () => {
  it("marks the current step and checks off earlier ones", () => {
    render(<WizardSteps steps={["One", "Two", "Three"]} current={1} />);
    expect(screen.getByText("Two").closest("li")?.getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("One").closest("li")?.getAttribute("aria-current")).toBeNull();
    expect(screen.getByText("Three").closest("li")?.textContent).toContain("3");
  });

  it("styles list and steps from design tokens", () => {
    const { container } = render(<WizardSteps steps={["One", "Two"]} current={0} />);
    const list = container.querySelector('[data-slot="wizard"]');
    expect(list?.classList.contains("gap-x-3")).toBe(true);
    expect(list?.className).not.toContain("gap-x-wizard-steps-gap");
    expect(list?.classList.contains("gap-y-2")).toBe(true);
    expect(list?.className).not.toContain("gap-y-wizard-steps-row-gap");
    const item = screen.getByText("One").closest("li");
    expect(item?.classList.contains("gap-2")).toBe(true);
    expect(item?.className).not.toContain("gap-wizard-step-gap");
    const badge = item?.querySelector("span[aria-hidden]");
    expect(badge?.classList.contains("size-wizard-step-badge")).toBe(true);
    expect(badge?.className).not.toMatch(/(^|\s)size-6(\s|$)/);
  });

  it("shows a compact step summary for narrow viewports", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(max-width: 639px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<WizardSteps steps={["One", "Two", "Three"]} current={1} />);
    expect(screen.getByText("Step 2 of 3 · Two")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Progress" }).getAttribute("aria-valuenow")).toBe("2");
  });
});

describe("WizardStep", () => {
  it("composes a custom step with explicit state", () => {
    render(
      <Wizard>
        <WizardStep step="One" index={0} state="done" showConnector />
        <WizardStep step="Two" index={1} state="current" />
      </Wizard>,
    );
    expect(screen.getByText("Two").closest("li")?.getAttribute("aria-current")).toBe("step");
    expect(screen.getByText("One").closest("li")?.querySelector(".lucide-check")).not.toBeNull();
  });
});

describe("OptionCards", () => {
  const options = [
    { id: "a", title: "Alpha", description: "First." },
    { id: "b", title: "Beta" },
  ];

  it("renders preselected cards as checked", () => {
    render(<OptionCards options={options} selected={["a"]} onChange={() => {}} />);
    expect((screen.getByRole("checkbox", { name: /Alpha/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: /Beta/ }) as HTMLInputElement).checked).toBe(false);
  });

  it("adds and removes ids when cards are clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<OptionCards options={options} selected={["a"]} onChange={onChange} />);
    await user.click(screen.getByText("Beta"));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    rerender(<OptionCards options={options} selected={["a", "b"]} onChange={onChange} />);
    await user.click(screen.getByText("Alpha"));
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });

  it("styles group and cards from design tokens", () => {
    const { container } = render(<OptionCards options={options} selected={["a"]} onChange={() => {}} />);
    const group = container.querySelector('[role="group"]');
    expect(group?.className).toContain("gap-3");
    expect(group?.className).not.toContain("gap-option-cards-gap");
    const card = screen.getByText("Alpha").closest("label");
    expect(card?.className).toContain("gap-3");
    expect(card?.className).not.toContain("gap-option-card-gap");
    expect(card?.classList.contains("p-4")).toBe(true);
  });
});

describe("OptionCard", () => {
  it("composes a standalone selectable card", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OptionCard title="Alpha" description="First." checked={false} onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: /Alpha/ });
    expect((box as HTMLInputElement).checked).toBe(false);
    await user.click(screen.getByText("Alpha"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
