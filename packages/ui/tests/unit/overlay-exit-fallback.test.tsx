import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExitUnmountFallback } from "#overlay-modal.js";

function Panel({ state }: { state: "open" | "closed" }) {
  const ref = useExitUnmountFallback<HTMLDivElement>();
  return <div ref={ref} data-state={state} data-testid="panel" />;
}

function stubDuration(value: string) {
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation(((element: Element) => {
    const styles = real(element);
    return new Proxy(styles, {
      get(target, property) {
        if (property === "animationDuration") return value;
        if (property === "animationName") return "exit-fake";
        const out = Reflect.get(target, property);
        return typeof out === "function" ? out.bind(target) : out;
      },
    });
  }) as typeof window.getComputedStyle);
}

function listen(node: HTMLElement) {
  const ended = vi.fn();
  node.addEventListener("animationend", ended);
  return ended;
}

describe("useExitUnmountFallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("synthesizes animationend after the exit duration plus grace", () => {
    stubDuration("200ms");
    const { getByTestId } = render(<Panel state="closed" />);
    const ended = listen(getByTestId("panel"));
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(ended).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("reads seconds, takes the first of a list, and treats junk as zero", () => {
    stubDuration("0.5s, 3s");
    const first = render(<Panel state="closed" />);
    const a = listen(first.getByTestId("panel"));
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(a).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(a).toHaveBeenCalledTimes(1);
    first.unmount();

    for (const junk of ["", "fast", "..s"]) {
      vi.restoreAllMocks();
      stubDuration(junk);
      const view = render(<Panel state="closed" />);
      const ended = listen(view.getByTestId("panel"));
      act(() => {
        vi.advanceTimersByTime(1001);
      });
      expect(ended).toHaveBeenCalledTimes(1);
      view.unmount();
    }
  });

  it("does not arm while the panel is open, and arms when it closes", async () => {
    stubDuration("100ms");
    const view = render(<Panel state="open" />);
    const node = view.getByTestId("panel");
    const ended = listen(node);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(ended).not.toHaveBeenCalled();
    view.rerender(<Panel state="closed" />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("cancels when the panel reopens before the timer fires", async () => {
    stubDuration("100ms");
    const view = render(<Panel state="closed" />);
    const node = view.getByTestId("panel");
    const ended = listen(node);
    node.setAttribute("data-state", "open");
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(ended).not.toHaveBeenCalled();
  });

  it("stays quiet when the node is gone by the time the timer fires", () => {
    stubDuration("100ms");
    const view = render(<Panel state="closed" />, { container: document.createElement("div") });
    const node = view.getByTestId("panel");
    const ended = listen(node);
    expect(node.isConnected).toBe(false);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(ended).not.toHaveBeenCalled();
  });

  it("falls back to a plain Event when AnimationEvent is missing", () => {
    stubDuration("0ms");
    vi.stubGlobal("AnimationEvent", undefined);
    const { getByTestId } = render(<Panel state="closed" />);
    const seen: string[] = [];
    getByTestId("panel").addEventListener("animationend", (event) => {
      seen.push(String((event as unknown as { animationName: string }).animationName));
    });
    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(seen).toEqual(["exit-fake"]);
  });
});
