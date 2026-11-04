import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeScope,
} from "#index.js";

describe("ThemeScope", () => {
  it("exposes a host with identity and mode on the same node", () => {
    const { container } = render(
      <ThemeScope identity="press" className="rounded-xl">
        Preview
      </ThemeScope>,
    );
    const scope = container.querySelector("[data-slot='theme-scope']");
    scope?.classList.add("dark");
    expect(scope?.getAttribute("data-identity-scope")).toBe("");
    expect(scope?.getAttribute("data-identity")).toBe("press");
    expect(scope?.classList.contains("dark")).toBe(true);
    expect(scope?.className).toContain("font-sans");
    expect(scope?.className).toContain("rounded-xl");
  });

  it("leaves root overlays on document.body when no scope is provided", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.closest("[data-slot='theme-scope']")).toBeNull();
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("mounts a dialog to the body with the nearest scope look mirrored", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ThemeScope identity="maison">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Details</DialogTitle>
          </DialogContent>
        </Dialog>
      </ThemeScope>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    // Outside the scope subtree (no trapping stacking context), but the mirror keeps the look.
    expect(container.contains(dialog)).toBe(false);
    const mirror = dialog.closest("[data-slot='theme-scope']");
    expect(mirror?.getAttribute("data-identity")).toBe("maison");
    expect(mirror?.parentElement).toBe(document.body);
  });
});

function OpenDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Details</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

/** Dropdown panels still portal into the scope itself, unlike dialogs. */
function OpenPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open</Button>
      </PopoverTrigger>
      <PopoverContent>Frozen peas</PopoverContent>
    </Popover>
  );
}

describe("ThemeScope consumer refs", () => {
  it("fills an object ref and keeps dropdown portals inside the scope", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <ThemeScope identity="press" ref={ref}>
        <OpenPopover />
      </ThemeScope>,
    );
    expect(ref.current?.getAttribute("data-slot")).toBe("theme-scope");
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(ref.current?.contains(screen.getByText("Frozen peas"))).toBe(true);
  });

  it("calls a callback ref with the node, keeps dropdown portals inside the scope, and releases it on unmount", async () => {
    const user = userEvent.setup();
    const seen: Array<HTMLElement | null> = [];
    const { unmount } = render(
      <ThemeScope
        identity="maison"
        ref={(node) => {
          seen.push(node);
        }}
      >
        <OpenPopover />
      </ThemeScope>,
    );
    const node = seen[0];
    expect(node?.getAttribute("data-identity")).toBe("maison");
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(node?.contains(screen.getByText("Frozen peas"))).toBe(true);
    unmount();
    expect(seen.at(-1)).toBeNull();
  });

  it("runs a cleanup returned by a callback ref instead of a null call", () => {
    const cleanup = vi.fn();
    const attach = vi.fn(() => cleanup);
    const { unmount } = render(<ThemeScope ref={attach}>x</ThemeScope>);
    expect(attach).toHaveBeenCalledTimes(1);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(1);
  });

  it("clears an object ref on unmount", () => {
    const ref = createRef<HTMLDivElement>();
    const { unmount } = render(<ThemeScope ref={ref}>x</ThemeScope>);
    expect(ref.current).not.toBeNull();
    unmount();
    expect(ref.current).toBeNull();
  });

  it("follows a swapped ref without losing the portal container", async () => {
    const user = userEvent.setup();
    const first = createRef<HTMLDivElement>();
    const second = createRef<HTMLDivElement>();
    const { rerender } = render(
      <ThemeScope ref={first}>
        <OpenPopover />
      </ThemeScope>,
    );
    rerender(
      <ThemeScope ref={second}>
        <OpenPopover />
      </ThemeScope>,
    );
    expect(first.current).toBeNull();
    expect(second.current).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(second.current?.contains(screen.getByText("Frozen peas"))).toBe(true);
  });
});

describe("ThemeScope nested scopes, opposite modes and portals", () => {
  it("mirrors the nearest scope look on a body-mounted overlay: the nested look, its own mode, refs intact", async () => {
    const user = userEvent.setup();
    const outerRef = createRef<HTMLDivElement>();
    const seen: Array<HTMLElement | null> = [];
    const { unmount } = render(
      <ThemeScope identity="tide" mode="dark" ref={outerRef} data-label="outer">
        <ThemeScope
          identity="press"
          ref={(node) => {
            seen.push(node);
          }}
          data-label="press"
        >
          <ThemeScope mode="dark" data-label="press-dark">
            <ThemeScope mode="light" data-label="press-light-again">
              <OpenDialog />
            </ThemeScope>
          </ThemeScope>
        </ThemeScope>
      </ThemeScope>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    // Outside every scope subtree, so no trapping stacking context applies.
    expect(outerRef.current?.contains(dialog)).toBe(false);
    const host = dialog.closest("[data-slot='theme-scope']");
    // Nearest scope look: Press again in light, although Tide dark encloses everything.
    expect(host?.getAttribute("data-identity")).toBe("press");
    expect(host?.classList.contains("dark")).toBe(false);
    expect(host?.parentElement).toBe(document.body);
    expect(outerRef.current?.getAttribute("data-identity")).toBe("tide");
    expect(outerRef.current?.classList.contains("dark")).toBe(true);
    expect(seen[0]?.getAttribute("data-identity")).toBe("press");
    unmount();
    expect(outerRef.current).toBeNull();
    expect(seen.at(-1)).toBeNull();
  });

  it("an overlay opened in a dark section keeps that section's identity and mode", async () => {
    const user = userEvent.setup();
    render(
      <ThemeScope identity="tide">
        <ThemeScope identity="maison" mode="dark" data-label="maison-dark">
          <OpenDialog />
        </ThemeScope>
      </ThemeScope>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    const host = dialog.closest("[data-slot='theme-scope']");
    expect(host?.getAttribute("data-identity")).toBe("maison");
    expect(host?.classList.contains("dark")).toBe(true);
    expect(host?.parentElement).toBe(document.body);
  });
});

describe("ThemeScope nested identity", () => {
  const host = (container: HTMLElement, label: string) => container.querySelector(`[data-label='${label}']`);

  it("lets a nested dark scope keep the nearer identity", () => {
    const { container } = render(
      <ThemeScope identity="press">
        <ThemeScope mode="dark" data-label="dark">
          <ThemeScope mode="light" data-label="light" />
        </ThemeScope>
      </ThemeScope>,
    );
    const dark = host(container, "dark");
    expect(dark?.getAttribute("data-identity")).toBe("press");
    expect(dark?.hasAttribute("data-identity-scope")).toBe(true);
    expect(dark?.classList.contains("dark")).toBe(true);
    expect(host(container, "light")?.getAttribute("data-identity")).toBe("press");
  });

  it("does not pin the identity of a nested scope that sets no mode", () => {
    const { container } = render(
      <ThemeScope identity="press" mode="dark">
        <ThemeScope data-label="plain" />
      </ThemeScope>,
    );
    expect(host(container, "plain")?.hasAttribute("data-identity")).toBe(false);
  });

  it("lets an explicit identity win over the enclosing one", () => {
    const { container } = render(
      <ThemeScope identity="press">
        <ThemeScope identity="maison" mode="dark" data-label="inner" />
      </ThemeScope>,
    );
    expect(host(container, "inner")?.getAttribute("data-identity")).toBe("maison");
  });

  it("leaves a mode-only scope under the page root without an identity", () => {
    const { container } = render(<ThemeScope mode="dark" data-label="root" />);
    expect(host(container, "root")?.hasAttribute("data-identity")).toBe(false);
  });
});
