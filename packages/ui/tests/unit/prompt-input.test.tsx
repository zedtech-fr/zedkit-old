import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PromptInput } from "#prompt-input.js";

describe("PromptInput", () => {
  it("submits on Enter and keeps Shift+Enter as a newline", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput sendLabel="Generate" value="Hello" onChange={() => {}} onSubmit={onSubmit} aria-label="Brief" />,
    );
    const field = screen.getByLabelText("Brief");
    await user.type(field, "{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    onSubmit.mockClear();
    await user.type(field, "{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables send when the value is empty", () => {
    render(<PromptInput sendLabel="Generate" value="" onChange={() => {}} onSubmit={() => {}} aria-label="Brief" />);
    expect((screen.getByRole("button", { name: "Generate" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls onSubmit from the send button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PromptInput sendLabel="Generate" value="Hi" onChange={() => {}} onSubmit={onSubmit} aria-label="Brief" />,
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
