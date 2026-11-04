import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReset } from "#index.js";

function setMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("ScrollReset", () => {
  let scrollTo: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    setMotion(false);
    window.history.replaceState(null, "", "/a");
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does not scroll on first render", () => {
    render(<ScrollReset routeKey="/a" />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to top instantly when the route key changes", () => {
    const { rerender } = render(<ScrollReset routeKey="/a" />);
    window.history.pushState(null, "", "/b");
    rerender(<ScrollReset routeKey="/b" />);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("forces instant under reduced motion even when smooth is asked", () => {
    setMotion(true);
    const { rerender } = render(<ScrollReset routeKey="/a" behavior="smooth" />);
    rerender(<ScrollReset routeKey="/b" behavior="smooth" />);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("uses smooth when motion is allowed and asked", () => {
    const { rerender } = render(<ScrollReset routeKey="/a" behavior="smooth" />);
    rerender(<ScrollReset routeKey="/b" behavior="smooth" />);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
  });

  it("scrolls to the #hash anchor instead of the top", () => {
    const anchor = document.createElement("h2");
    anchor.id = "usage";
    anchor.scrollIntoView = vi.fn();
    document.body.append(anchor);
    const { rerender } = render(<ScrollReset routeKey="/a" />);
    window.history.pushState(null, "", "/b#usage");
    rerender(<ScrollReset routeKey="/b" />);
    expect(anchor.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves back/forward navigation to the browser", () => {
    const { rerender } = render(<ScrollReset routeKey="/a" />);
    window.dispatchEvent(new PopStateEvent("popstate"));
    rerender(<ScrollReset routeKey="/b" />);
    expect(scrollTo).not.toHaveBeenCalled();
    rerender(<ScrollReset routeKey="/c" />);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("a hash-only back/forward does not swallow a later navigation", () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    const { rerender } = render(<ScrollReset routeKey="/a" />);
    window.dispatchEvent(new PopStateEvent("popstate"));
    now.mockReturnValue(20_000);
    rerender(<ScrollReset routeKey="/b" />);
    now.mockRestore();
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("scrolls a custom container when given", () => {
    const box = document.createElement("main");
    box.scrollTo = vi.fn();
    const target = () => box;
    const { rerender } = render(<ScrollReset routeKey="/a" target={target} />);
    rerender(<ScrollReset routeKey="/b" target={target} />);
    expect(box.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("ScrollReset hash decoding", () => {
  it("finds a percent-encoded anchor id", () => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const anchor = document.createElement("h2");
    anchor.id = "déjà";
    anchor.scrollIntoView = vi.fn();
    document.body.append(anchor);
    const { rerender } = render(<ScrollReset routeKey="/a" />);
    window.history.pushState(null, "", "/b#d%C3%A9j%C3%A0");
    rerender(<ScrollReset routeKey="/b" />);
    expect(anchor.scrollIntoView).toHaveBeenCalled();
    anchor.remove();
  });
});
