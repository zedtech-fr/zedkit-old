import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WordRoll } from "#index.js";

describe("WordRoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps overflow visible on the in-flow host and clips on the overlay (baseline-safe)", () => {
    const { container } = render(<WordRoll words={["Alpha", "Beta"]} value="Alpha" />);
    const host = container.querySelector("[data-slot=word-roll]");
    expect(host).toBeTruthy();
    expect(host?.getAttribute("data-word-roll")).toBe("");
    expect(host?.className).toContain("inline-block");
    expect(host?.className).not.toContain("overflow-hidden");
    const clip = host?.querySelector("[data-word-roll-clip]");
    expect(clip?.className).toContain("overflow-hidden");
    const resting = host?.querySelector('[data-word-roll="in"]');
    expect(resting?.textContent).toBe("Alpha");
    expect(host?.querySelector('[data-animate="fade-up"]')).toBeNull();
  });

  it("shows an outgoing layer with data-word-roll exit when value changes", () => {
    const { container, rerender } = render(<WordRoll words={["Alpha", "Beta"]} value="Alpha" />);
    rerender(<WordRoll words={["Alpha", "Beta"]} value="Beta" />);
    const exit = container.querySelector('[data-word-roll="exit"]');
    expect(exit?.textContent).toBe("Alpha");
    const enter = container.querySelector('[data-animate="fade-up"]');
    expect(enter?.textContent).toBe("Beta");
  });

  it("falls back to the first word when value is not in the list", () => {
    render(<WordRoll words={["One", "Two"]} value="Unknown" />);
    expect(screen.getAllByText("One").length).toBeGreaterThan(0);
  });
});
