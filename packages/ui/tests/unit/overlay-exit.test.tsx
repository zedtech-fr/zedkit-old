import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "#index.js";
import { stubDrawerJsdom } from "./drawer-fixture.js";

/**
 * jsdom runs no CSS animations, so Radix Presence would always take the instant path. Fake the
 * animation name through a live `getComputedStyle` proxy: mount with the enter name, switch to the
 * exit name before closing. Everything else delegates to the real declaration.
 */
function stubExitAnimation() {
  const cell = { name: "enter-fake" };
  const real = window.getComputedStyle.bind(window);
  const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(
    ((element: Element) => {
      const styles = real(element);
      return new Proxy(styles, {
        get(target, property) {
          if (property === "animationName") return cell.name;
          const value = Reflect.get(target, property);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    }) as typeof window.getComputedStyle,
  );
  return { cell, spy };
}

function dispatchAnimationEvent(
  node: HTMLElement,
  type: "animationend" | "animationcancel" | "animationstart",
  name: string,
): void {
  let event: Event;
  if (typeof AnimationEvent === "function") {
    event = new AnimationEvent(type, { animationName: name });
  } else {
    event = new Event(type);
    Object.defineProperty(event, "animationName", { value: name });
  }
  act(() => {
    node.dispatchEvent(event);
  });
}

function OpenDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Details</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

function OpenDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Delivery details</DrawerTitle>
      </DrawerContent>
    </Drawer>
  );
}

describe("overlay exit lifecycle", () => {
  beforeAll(() => {
    stubDrawerJsdom();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps a closing dialog mounted in the closed state until animationend", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog");
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    const closing = screen.getByRole("dialog");
    expect(closing.getAttribute("data-state")).toBe("closed");
    dispatchAnimationEvent(closing as HTMLElement, "animationend", "exit-fake");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(dialog.isConnected).toBe(false);
  });

  it("unmounts a closing dialog instantly without an exit animation", async () => {
    const user = userEvent.setup();
    render(<OpenDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("unmounts a closing dialog on animationcancel", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    const closing = screen.getByRole("dialog");
    dispatchAnimationEvent(closing as HTMLElement, "animationcancel", "exit-fake");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ignores animationend for a stale animation name", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    const closing = screen.getByRole("dialog");
    dispatchAnimationEvent(closing as HTMLElement, "animationend", "enter-fake");
    expect(screen.getByRole("dialog")).not.toBeNull();
    dispatchAnimationEvent(closing as HTMLElement, "animationend", "exit-fake");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reopens cleanly when opened mid-exit", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog").getAttribute("data-state")).toBe("closed");
    // Still modal while suspended, so the trigger stays hidden and click-through is off; reopen with a
    // raw click, the way a controlled parent would flip `open` back mid-exit.
    fireEvent.click(screen.getByRole("button", { name: "Open dialog", hidden: true }));
    const reopened = screen.getByRole("dialog");
    expect(reopened.getAttribute("data-state")).toBe("open");
    // Reopening restarts the enter animation, so the next close suspends again instead of unmounting.
    exit.cell.name = "enter-fake-2";
    dispatchAnimationEvent(reopened as HTMLElement, "animationstart", "enter-fake-2");
    exit.cell.name = "exit-fake-2";
    await user.keyboard("{Escape}");
    const closing = screen.getByRole("dialog");
    expect(closing.getAttribute("data-state")).toBe("closed");
    dispatchAnimationEvent(closing as HTMLElement, "animationend", "exit-fake-2");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps a closing drawer mounted in the closed state until animationend", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const drawer = screen.getByRole("dialog", { name: "Delivery details" });
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    const closing = screen.getByRole("dialog", { name: "Delivery details" });
    expect(closing.getAttribute("data-state")).toBe("closed");
    dispatchAnimationEvent(closing as HTMLElement, "animationend", "exit-fake");
    expect(screen.queryByRole("dialog", { name: "Delivery details" })).toBeNull();
    expect(drawer.isConnected).toBe(false);
  });

  it("unmounts a closing drawer instantly without an exit animation", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Delivery details" })).toBeNull();
  });

  it("unmounts a stuck closing dialog when animationend never fires", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDialog />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog").getAttribute("data-state")).toBe("closed");
    // No end event: the fallback synthesizes one after the exit duration plus grace.
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.querySelector("[data-slot='dialog-overlay']")).toBeNull();
      },
      { timeout: 5000 },
    );
  });

  it("unmounts a stuck closing drawer when animationend never fires", async () => {
    const user = userEvent.setup();
    const exit = stubExitAnimation();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    exit.cell.name = "exit-fake";
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Delivery details" }).getAttribute("data-state")).toBe("closed");
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog", { name: "Delivery details" })).toBeNull();
        expect(document.querySelector("[data-slot='drawer-overlay']")).toBeNull();
      },
      { timeout: 5000 },
    );
  });

  it("retunes vaul durations to the motion tokens above vaul's own specificity", () => {
    const css = readFileSync(resolve(__dirname, "../../src/styles.css"), "utf8");
    expect(css).toContain(':root:not([data-motion="reduce"]) [data-vaul-drawer]');
    expect(css).toContain(':root:not([data-motion="reduce"]) [data-vaul-overlay]');
    expect(css).toContain("animation-duration: var(--motion-slow) !important;");
    expect(css).toContain("animation-duration: var(--motion-base) !important;");
  });
});
