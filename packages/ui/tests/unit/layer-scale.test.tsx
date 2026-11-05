import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import {
  AppShell,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerTitle,
  ThemeScope,
  Toaster,
  toast,
} from "#index.js";
import { MarketingHeader } from "#marketing/index.js";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { RegionSelect, stubSelectJsdom } from "./select-fixture.js";

const pkg = resolve(__dirname, "../..");
const css = readFileSync(resolve(pkg, "src/styles.css"), "utf8");

function zVar(name: string): number {
  const match = css.match(new RegExp(`--z-${name}:\\s*(\\d+);`));
  if (!match) throw new Error(`missing --z-${name}`);
  return Number(match[1]);
}

describe("layer scale", () => {
  it("orders header < dropdown < overlay < drawer/dialog < toast", () => {
    const header = zVar("header");
    const dropdown = zVar("dropdown");
    const overlay = zVar("overlay");
    const drawer = zVar("drawer");
    const dialog = zVar("dialog");
    const toastLevel = zVar("toast");
    expect(header).toBeLessThan(dropdown);
    expect(dropdown).toBeLessThan(overlay);
    expect(overlay).toBeLessThan(drawer);
    expect(drawer).toBe(dialog);
    expect(dialog).toBeLessThan(toastLevel);
  });

  it("maps every layer to a Tailwind z utility with no magic numbers", () => {
    for (const name of ["header", "dropdown", "overlay", "drawer", "dialog", "toast"]) {
      expect(css).toMatch(new RegExp(`--z-index-${name}:\\s*var\\(--z-${name}\\);`));
    }
    expect(css).not.toMatch(/--z-index-\w+:\s*\d+;/);
  });

  it("puts headers on the header token only", () => {
    const shell = render(<AppShell sidebar={null} topbar="bar" children={null} />);
    expect(shell.container.querySelector("header")?.className).toContain("z-header");
    const marketing = render(<MarketingHeader brand="brand" />);
    expect(marketing.container.querySelector("header")?.className).toContain("z-header");
    for (const { container } of [shell, marketing]) {
      expect(container.querySelector("header")?.className).not.toMatch(/(^|\s)z-\d/);
    }
  });

  it("puts the toast viewport on the toast token above dialogs and drawers", async () => {
    render(<Toaster />);
    toast("Saved");
    await screen.findByText("Saved");
    expect(document.querySelector("[data-sonner-toaster]")).not.toBeNull();
    expect(css).toMatch(/ol\[data-sonner-toaster\]\s*\{\s*z-index:\s*var\(--z-toast\);\s*\}/);
  });
});

describe("overlay mounts", () => {
  beforeAll(() => {
    stubDrawerJsdom();
    stubSelectJsdom();
  });

  it("mounts drawer overlay and panel to the body, outside the trapping scope", () => {
    render(
      <ThemeScope identity="press" mode="dark">
        <div className="isolate" data-testid="trap">
          <Drawer open>
            <DrawerContent>
              <DrawerTitle>Delivery details</DrawerTitle>
            </DrawerContent>
          </Drawer>
        </div>
      </ThemeScope>,
    );
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    const scope = document.querySelector("[data-testid='trap']");
    expect(scope?.contains(dialog)).toBe(false);
    const mirror = dialog.parentElement;
    expect(mirror?.getAttribute("data-slot")).toBe("theme-scope");
    expect(mirror?.getAttribute("data-identity")).toBe("press");
    expect(mirror?.classList.contains("dark")).toBe(true);
    expect(mirror?.parentElement).toBe(document.body);
    const overlay = document.querySelector("[data-vaul-overlay]");
    expect(overlay?.parentElement).toBe(mirror);
  });

  it("mounts dialog panels to the body with the scope look mirrored", () => {
    render(
      <ThemeScope identity="glass" mode="light">
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Details</DialogTitle>
          </DialogContent>
        </Dialog>
      </ThemeScope>,
    );
    const dialog = screen.getByRole("dialog", { name: "Details" });
    const mirror = dialog.parentElement;
    expect(mirror?.getAttribute("data-slot")).toBe("theme-scope");
    expect(mirror?.getAttribute("data-identity")).toBe("glass");
    expect(mirror?.classList.contains("dark")).toBe(false);
    expect(mirror?.parentElement).toBe(document.body);
  });

  it("mounts a select opened inside a dialog into the dialog panel", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <RegionSelect />
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    const listbox = await screen.findByRole("listbox");
    const dialog = screen.getByRole("dialog", { name: "Details" });
    expect(dialog.contains(listbox)).toBe(true);
  });
});
