import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Button } from "#index.js";
import { ConfirmDialog } from "#index.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "#index.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#index.js";
import { Popover, PopoverContent, PopoverTrigger } from "#index.js";
import { Label } from "#index.js";
import { SecretField } from "#index.js";
import { Toaster, toast } from "#index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "#index.js";
import { stubSelectJsdom } from "./select-fixture.js";
import { assertNoValueArbitraries } from "./no-arbitraries.js";

describe("overlays", () => {
  beforeAll(() => {
    stubSelectJsdom();
  });

  it("opens and closes a dialog", async () => {
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
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("traps Tab inside a modal dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Details</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <button type="button">after</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 8; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 8; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("focuses the panel itself on open, never a field", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <input aria-label="Name" defaultValue="Ada" />
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("initialFocus moves to the field with the caret at the end", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent initialFocus="#dialog-name">
          <DialogTitle>Details</DialogTitle>
          <input id="dialog-name" aria-label="Name" defaultValue="Ada" />
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const field = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(3);
    expect(field.selectionEnd).toBe(3);
  });

  it("returns focus to the trigger after Escape on a dialog", async () => {
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
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
  });

  it("animates dialog content in through the motion tokens", async () => {
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
    expect(dialog.getAttribute("data-state")).toBe("open");
    expect(dialog.className).toContain("zk-zoom-in");
    expect(dialog.className).toContain("var(--motion-base)");
  });

  it("centers dialog content with token-driven position and shadow", async () => {
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
    expect(dialog.className).toContain("dialog-center");
    expect(dialog.className).toContain("shadow-overlay");
    expect(dialog.className).not.toContain("top-[");
    expect(dialog.className).not.toContain("translate-");
  });

  it("spaces dialog slots from theme tokens", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("z-dialog");
    expect(dialog.className).not.toContain("z-overlay");
    expect(dialog.className).toContain("gap-4");
    expect(dialog.className).toContain("p-dialog-padding");
    expect(dialog.className).toContain("max-h-dialog-max-height");
    expect(dialog.className).toContain("overflow-y-auto");
    expect(dialog.className).toContain("overscroll-y-contain");
    expect(screen.getByText("Details").parentElement?.className).toContain("gap-dialog-header-stack");
    expect(screen.getByText("Details").parentElement?.className).toContain("text-left");
    expect(screen.getByText("Details").parentElement?.className).not.toContain("bg-background");
    expect(screen.getByText("Details").parentElement?.className).toContain("sticky");
    expect(screen.getByText("Details").parentElement?.className).toContain("pr-dialog-header-end");
    expect(screen.getByRole("button", { name: "Save" }).parentElement?.className).toContain("gap-2");
    expect(screen.getByRole("button", { name: "Save" }).parentElement?.className).not.toContain("bg-background");
    expect(screen.getByRole("button", { name: "Save" }).parentElement?.className).toContain("sticky");
    expect(screen.getByRole("button", { name: "Save" }).parentElement?.className).toContain("pb-dialog-footer-safe");
    const close = screen.getByRole("button", { name: "Close" });
    expect(close.className).toContain("top-0");
    expect(close.className).toContain("right-0");
    expect(close.className).toContain("z-20");
    expect(close.className).toContain("size-overlay-touch-target");
    expect(close.className).toContain("focus-ring-control");
    expect(close.className).toContain("opacity-70");
    expect(close.innerHTML).toContain("size-4");
    expect(close.innerHTML).not.toContain("size-icon-control");
  });

  describe("visual viewport", () => {
    afterEach(() => {
      Reflect.deleteProperty(window, "visualViewport");
    });

    it("caps height and recenters against the visual viewport", async () => {
      Object.defineProperty(window, "visualViewport", {
        configurable: true,
        value: {
          offsetTop: 48,
          height: 400,
          addEventListener: () => {},
          removeEventListener: () => {},
        },
      });
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
      expect(dialog.style.maxHeight).toBe("min(var(--spacing-dialog-max-height), 384px)");
      expect(dialog.style.top).toBe("248px");
    });
  });

  it("animates the dialog overlay through the motion tokens", async () => {
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
    const overlay = document.querySelector(".bg-overlay\\/80");
    expect(overlay?.getAttribute("data-state")).toBe("open");
    expect(overlay?.getAttribute("class")).toContain("zk-fade-in");
  });

  it("confirms destructive actions and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders any trigger element via the asChild slot", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<a href="/items">Delete item</a>}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    );
    const trigger = screen.getByRole("link", { name: "Delete item" });
    expect(trigger.getAttribute("href")).toBe("/items");
    await user.click(trigger);
    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("shows a toast through the themed viewport", async () => {
    render(<Toaster />);
    toast("Saved");
    expect(await screen.findByText("Saved")).not.toBeNull();
  });

  it("maps toast theme to CSS-var tokens only", async () => {
    const { container } = render(<Toaster />);
    toast("Saved");
    await screen.findByText("Saved");
    for (const token of ["bg-card", "text-card-foreground", "border-border"]) {
      expect(container.innerHTML).toContain(token);
    }
    expect(container.innerHTML).not.toMatch(/bg-(red|blue|green|amber)-/);
  });

  it("opens and closes a popover", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Filters</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filters">Open invoices only.</PopoverContent>
      </Popover>,
    );
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const panel = screen.getByRole("dialog", { name: "Filters" });
    expect(panel).not.toBeNull();
    expect(panel.className).toContain("z-dropdown");
    expect(panel.className).not.toContain("z-overlay");
    expect(panel.className).toContain("bg-popover");
    assertNoValueArbitraries(panel.className);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull();
  });

  it("shows a tooltip on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Save</Button>
        </TooltipTrigger>
        <TooltipContent>Saves the invoice</TooltipContent>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
    await user.hover(screen.getByRole("button", { name: "Save" }));
    const tip = await screen.findByRole("tooltip");
    expect(tip.textContent).toContain("Saves the invoice");
    expect(tip.className).toContain("z-dropdown");
    expect(tip.className).not.toContain("z-overlay");
    expect(tip.className).toContain("px-3");
    expect(tip.className).not.toContain("px-control-inline");
    assertNoValueArbitraries(tip.className);
  });

  it("opens a menu, picks an item, and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Duplicate invoice</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Archive invoice</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu.className).toContain("z-dropdown");
    expect(menu.className).not.toContain("z-overlay");
    assertNoValueArbitraries(menu.className);
    const item = screen.getByRole("menuitem", { name: "Duplicate invoice" });
    expect(item.className).toContain("px-2");
    expect(item.className).toContain("py-1.5");
    expect(item.className).not.toContain("px-select-item-inline");
    expect(item.className).not.toContain("py-select-item-block");
    await user.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  describe("secret field", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("copies the value and shows feedback", async () => {
      const user = userEvent.setup();
      const writeText = vi.fn(async () => {});
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      render(<SecretField id="key" value="zbk_secret" />);
      await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
      expect(writeText).toHaveBeenCalledWith("zbk_secret");
      expect(screen.getByRole("status").textContent).toBe("Copied");
    });

    it("announces when the clipboard API is missing", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("navigator", {});
      render(<SecretField id="key" value="zbk_secret" />);
      await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
      expect(screen.getByRole("status").textContent).toBe("Could not copy");
    });

    it("announces when writing to the clipboard is rejected", async () => {
      const user = userEvent.setup();
      const writeText = vi.fn(() => Promise.reject(new Error("denied")));
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      render(<SecretField id="key" value="zbk_secret" />);
      await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
      expect(screen.getByRole("status").textContent).toBe("Could not copy");
    });

    it("keeps the single-line input by default", () => {
      const { container } = render(<SecretField id="key" value="zbk_secret" />);
      expect(container.querySelector("input")?.getAttribute("value")).toBe("zbk_secret");
      expect(container.querySelector("textarea")).toBeNull();
    });

    it("multiline renders the full value in an auto-growing textarea and still copies it", async () => {
      const user = userEvent.setup();
      const writeText = vi.fn(async () => {});
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      const value = "pnpm dlx shadcn@latest add https://zedkit.app/r/themes/volt.json";
      const { container } = render(<SecretField multiline aria-label="Registry command" value={value} />);
      const field = screen.getByRole("textbox", { name: "Registry command" }) as HTMLTextAreaElement;
      expect(field.tagName).toBe("TEXTAREA");
      expect(field.value).toBe(value);
      expect(field.readOnly).toBe(true);
      expect(field.getAttribute("spellcheck")).toBe("false");
      expect(field.rows).toBe(1);
      expect(field.className).toContain("field-sizing-content");
      // Documented as wrapping: a long value reads in full on a phone instead of scrolling sideways in the box.
      expect(field.className).toContain("whitespace-pre-wrap");
      expect(field.className).toContain("wrap-anywhere");
      expect(field.className).not.toContain("whitespace-nowrap");
      expect(field.className).not.toContain("overflow-x-auto");
      expect(field.className).toContain("font-mono");
      expect(field.className).toContain("min-h-control-height");
      expect(field.className).not.toContain("min-h-textarea-min-height");
      expect(container.querySelector("input")).toBeNull();
      await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
      expect(writeText).toHaveBeenCalledWith(value);
    });

    it("multiline stays labelable and reserves one row per line as the no-field-sizing fallback", () => {
      render(
        <>
          <Label htmlFor="snippet">globals.css</Label>
          <SecretField multiline id="snippet" value={"@import \"tailwindcss\";\n@import \"@zedtech/zedkit-ui/styles.css\";"} />
        </>,
      );
      const field = screen.getByLabelText("globals.css") as HTMLTextAreaElement;
      expect(field.tagName).toBe("TEXTAREA");
      expect(field.rows).toBe(2);
    });

    it("uses token-driven gap and icon size with no arbitrary values", () => {
      const { container } = render(<SecretField id="key" value="zbk_secret" />);
      const root = container.firstElementChild;
      expect(root?.className).toContain("gap-2");
      expect(root?.className).not.toContain("gap-secret-field-gap");
      expect(root?.className).not.toContain("[");
      expect(container.querySelector("svg")?.className.baseVal ?? "").toContain("size-4");
      expect(container.querySelector("svg")?.className.baseVal ?? "").not.toContain("size-icon-control");
    });
  });
});
