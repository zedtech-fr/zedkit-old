import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MOTION_BOOTSTRAP_SOURCE } from "#motion-bootstrap.js";
import {
  MOTION_CHANGE_EVENT,
  MOTION_STORAGE_KEY,
  MotionScript,
  applyMotionPreference,
} from "#index.js";

afterEach(() => {
  document.documentElement.removeAttribute("data-motion");
  localStorage.clear();
});

function runScript(element: ReactElement) {
  const { container, unmount } = render(element);
  const script = container.querySelector('script[data-slot="motion-script"]') as HTMLScriptElement;
  const code = script.innerHTML;
  Object.defineProperty(document, "currentScript", { value: script, configurable: true });
  new Function(code)();
  unmount();
}

describe("MotionScript", () => {
  it("is not a client module, so a server layout can render it without hydrating", () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../src/motion-script.tsx"), "utf8");
    expect(src).not.toMatch(/^["']use client["']/m);
  });

  it("keeps a fixed bootstrap body and passes the storage key as a data attribute", () => {
    const { container, unmount } = render(<MotionScript storageKey={'key"with'} />);
    const script = container.querySelector('script[data-slot="motion-script"]') as HTMLScriptElement;
    expect(script.innerHTML).toBe(MOTION_BOOTSTRAP_SOURCE);
    expect(script.getAttribute("data-storage-key")).toBe('key"with');
    unmount();
  });

  it("leaves motion on when nothing is stored", () => {
    runScript(<MotionScript />);
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
  });

  it("sets data-motion=reduce from the stored key before paint", () => {
    localStorage.setItem(MOTION_STORAGE_KEY, "reduce");
    runScript(<MotionScript />);
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
  });

  it("ignores any stored value other than reduce", () => {
    localStorage.setItem(MOTION_STORAGE_KEY, "no-preference");
    runScript(<MotionScript />);
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
  });

  it("honours a custom storage key", () => {
    localStorage.setItem("my-motion", "reduce");
    runScript(<MotionScript storageKey="my-motion" />);
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
  });
});

describe("applyMotionPreference", () => {
  it("writes reduce onto html, storage, and the change event", () => {
    const seen: string[] = [];
    window.addEventListener(MOTION_CHANGE_EVENT, () => seen.push("change"));
    applyMotionPreference("reduce");
    expect(document.documentElement.getAttribute("data-motion")).toBe("reduce");
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("reduce");
    expect(seen).toEqual(["change"]);
  });

  it("clears the attribute so the OS media query is in charge again", () => {
    applyMotionPreference("reduce");
    applyMotionPreference("no-preference");
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });
});
