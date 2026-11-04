import { cleanup, render, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyMotionPreference, useMotionPreference, type MotionPreference } from "#index.js";

function Probe({ onValue }: { onValue: (value: MotionPreference) => void }) {
  onValue(useMotionPreference());
  return null;
}

function setMotion(reduce: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_type: string, fn: (event: MediaQueryListEvent) => void) => listeners.add(fn),
    removeEventListener: (_type: string, fn: (event: MediaQueryListEvent) => void) => listeners.delete(fn),
    dispatch: (matches: boolean) => {
      mql.matches = matches;
      for (const fn of listeners) fn({ matches } as MediaQueryListEvent);
    },
  };
  window.matchMedia = vi.fn().mockImplementation((query: string) =>
    query.includes("reduce") ? mql : { matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} },
  ) as unknown as typeof window.matchMedia;
  return mql;
}

describe("useMotionPreference", () => {
  beforeEach(() => {
    setMotion(false);
    document.documentElement.removeAttribute("data-motion");
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-motion");
    vi.unstubAllGlobals();
  });

  it("reports no-preference when the OS allows motion and the toggle is off", () => {
    let value: MotionPreference | undefined;
    render(<Probe onValue={(next) => (value = next)} />);
    expect(value).toBe("no-preference");
  });

  it("reports reduce when the OS asks to reduce motion", () => {
    setMotion(true);
    let value: MotionPreference | undefined;
    render(<Probe onValue={(next) => (value = next)} />);
    expect(value).toBe("reduce");
  });

  it("reports reduce when data-motion is set, even if the OS allows motion", async () => {
    let value: MotionPreference | undefined;
    render(<Probe onValue={(next) => (value = next)} />);
    expect(value).toBe("no-preference");
    await act(() => {
      applyMotionPreference("reduce");
    });
    expect(value).toBe("reduce");
  });
});
