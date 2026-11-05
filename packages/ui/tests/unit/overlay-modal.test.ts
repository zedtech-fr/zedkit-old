import { afterEach, describe, expect, it } from "vitest";
import { focusOverlayInitial, resolveModalMountAutoFocus, resolveOverlayInitialTarget } from "#overlay-modal.js";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("overlay initial focus target", () => {
  it("resolves no target to the panel", () => {
    const panel = document.createElement("div");
    expect(resolveOverlayInitialTarget(panel, undefined)).toBe(panel);
  });

  it("resolves a ref target", () => {
    const panel = document.createElement("div");
    const input = document.createElement("input");
    panel.append(input);
    expect(resolveOverlayInitialTarget(panel, { current: input })).toBe(input);
  });

  it("falls back to the panel when the ref is empty", () => {
    const panel = document.createElement("div");
    expect(resolveOverlayInitialTarget(panel, { current: null })).toBe(panel);
  });

  it("resolves a selector inside the panel", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `<input id="a"><input id="b">`;
    expect(resolveOverlayInitialTarget(panel, "#b")).toBe(panel.querySelector("#b"));
  });

  it("has no target for a selector when there is no panel", () => {
    expect(resolveOverlayInitialTarget(null, "#a")).toBeNull();
    expect(resolveOverlayInitialTarget(null, undefined)).toBeNull();
  });

  it("falls back to the panel for a missing or invalid selector", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `<input id="a">`;
    expect(resolveOverlayInitialTarget(panel, "#missing")).toBe(panel);
    expect(resolveOverlayInitialTarget(panel, "[[[")).toBe(panel);
  });
});

describe("overlay initial focus", () => {
  it("focuses the panel by default", () => {
    const panel = document.createElement("div");
    panel.tabIndex = -1;
    document.body.append(panel);
    focusOverlayInitial(panel, undefined);
    expect(document.activeElement).toBe(panel);
  });

  it("focuses the target field with the caret at the end, never selecting", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `<input type="text" value="hello">`;
    document.body.append(panel);
    const input = panel.querySelector("input") as HTMLInputElement;
    focusOverlayInitial(panel, { current: input });
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it("places the caret at the end of a textarea", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `<textarea>hello</textarea>`;
    document.body.append(panel);
    const area = panel.querySelector("textarea") as HTMLTextAreaElement;
    focusOverlayInitial(panel, { current: area });
    expect(document.activeElement).toBe(area);
    expect(area.selectionStart).toBe(5);
    expect(area.selectionEnd).toBe(5);
  });

  it("does nothing when there is no panel and no target", () => {
    expect(() => focusOverlayInitial(null, undefined)).not.toThrow();
  });

  it("focuses without a caret for field types that have none", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `<input type="number" value="42">`;
    document.body.append(panel);
    const input = panel.querySelector("input") as HTMLInputElement;
    focusOverlayInitial(panel, { current: input });
    expect(document.activeElement).toBe(input);
  });
});

describe("overlay modal mount autofocus", () => {
  it("defaults to modal when autoFocus is omitted", () => {
    expect(resolveModalMountAutoFocus(undefined, true)).toBe(true);
    expect(resolveModalMountAutoFocus(undefined, false)).toBe(false);
  });

  it("honors an explicit autoFocus override", () => {
    expect(resolveModalMountAutoFocus(false, true)).toBe(false);
    expect(resolveModalMountAutoFocus(true, false)).toBe(true);
  });
});
