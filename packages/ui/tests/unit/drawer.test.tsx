import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { assertNoValueArbitraries } from "./no-arbitraries.js";
import { Button } from "#index.js";

beforeAll(() => {
  stubDrawerJsdom();
});
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "#index.js";

function OpenDrawer(props: { direction?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Drawer {...(props.direction === undefined ? {} : { direction: props.direction })}>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerTitle>Delivery details</DrawerTitle>
        <DrawerDescription>Tracking and timeline.</DrawerDescription>
      </DrawerContent>
    </Drawer>
  );
}

describe("drawer", () => {
  it("opens and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when the overlay is clicked", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const overlay = document.querySelector("[data-vaul-overlay]");
    expect(overlay).not.toBeNull();
    expect(overlay?.className).toContain("backdrop-blur-sm");
    await user.click(overlay as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders on the right with the direction attribute", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("right");
    expect(dialog.className).toContain("right-0");
  });

  it("renders a full-height side panel narrower than the screen when mobile is side", async () => {
    const user = userEvent.setup();
    render(
      <Drawer mobile="side" direction="right">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog", { name: "Delivery details" });
    expect(panel.className).toContain("w-drawer-side-mobile-width");
    expect(panel.className).toContain("inset-y-0");
  });

  it("maps right drawers to bottom on narrow viewports when mobile is sheet", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("bottom");
    expect(dialog.className).toContain("bottom-0");
    stubDrawerJsdom();
  });

  it("gives bare content side gutters and a safe-area bottom inset, and tags the kit slots", async () => {
    const user = userEvent.setup();
    render(
      <Drawer direction="bottom">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>Body</DrawerBody>
          <DrawerFooter>Footer</DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    // Bare children (anything but the kit slots, the handle, and buttons) pick up the shared gutters.
    expect(dialog.className).toContain("px-4");
    expect(dialog.className).toContain("pb-drawer-footer-safe");
    // The slots carry their own spacing, so they are excluded from that net.
    for (const slot of ["drawer-handle", "drawer-header", "drawer-body", "drawer-footer"]) {
      expect(dialog.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("styles the close button from the overlay touch target token", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerCloseButton data-testid="close" />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByTestId("close").className).toContain("size-overlay-touch-target");
  });

  it("keeps the side panel on a narrow viewport when mobile is side", async () => {
    stubDrawerJsdom(true);
    const user = userEvent.setup();
    render(
      <Drawer mobile="side" direction="left">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("left");
    expect(dialog.className).toContain("w-drawer-side-mobile-width");
    stubDrawerJsdom();
  });

  it("respects the safe-area insets on every edge it touches", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="top" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog", { name: "Delivery details" }).className).toContain("pt-drawer-safe-top");
  });

  it("hides the handle on side drawers and moves it to the far edge of a top drawer", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHandle data-testid="handle" />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const handle = screen.getByTestId("handle");
    expect(handle.className).toContain("in-data-[vaul-drawer-direction=left]:hidden");
    expect(handle.className).toContain("in-data-[vaul-drawer-direction=right]:hidden");
    expect(handle.className).toContain("in-data-[vaul-drawer-direction=top]:order-last");
  });

  it("scrolls its body inside the drawer without chaining to the page", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
          <DrawerBody data-testid="body">content</DrawerBody>
        </DrawerContent>
      </Drawer>,
    );
    const body = screen.getByTestId("body");
    expect(body.className).toContain("overflow-y-auto");
    expect(body.className).toContain("overscroll-y-contain");
    expect(body.className).toContain("min-h-0");
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("positions on top with top-0", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="top" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("top");
    expect(dialog.className).toContain("top-0");
  });

  it("positions on the left with left-0", async () => {
    const user = userEvent.setup();
    render(
      <Drawer mobile="side" direction="left">
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("left");
    expect(dialog.className).toContain("left-0");
  });

  it("defaults to the bottom when direction is omitted", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.getAttribute("data-vaul-drawer-direction")).toBe("bottom");
    expect(dialog.className).toContain("bottom-0");
  });

  it("renders open when controlled open is true", () => {
    render(
      <Drawer open onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("ignores the trigger when controlled open is false", async () => {
    const user = userEvent.setup();
    render(
      <Drawer open={false} onOpenChange={() => {}}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders no overlay when modal is false", () => {
    render(
      <Drawer defaultOpen modal={false}>
        <DrawerContent modal={false}>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    expect(document.querySelector("[data-vaul-overlay]")).toBeNull();
  });

  it("stays open on overlay click when not dismissible", async () => {
    const user = userEvent.setup();
    render(
      <Drawer dismissible={false}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const overlay = document.querySelector("[data-vaul-overlay]");
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("exposes an unnamed dialog when the title is omitted", async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerDescription>Untitled panel.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(screen.queryByRole("dialog", { name: "Delivery details" })).toBeNull();
  });

  it("notifies open state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open on Escape when not dismissible", async () => {
    const user = userEvent.setup();
    render(
      <Drawer dismissible={false}>
        <DrawerTrigger asChild>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("stacks and sizes content from theme tokens", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="bottom" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const sheet = screen.getByRole("dialog", { name: "Delivery details" });
    expect(sheet.className).toContain("z-overlay");
    expect(sheet.className).toContain("max-h-drawer-sheet-max-height");
    expect(sheet.className).not.toContain("96dvh");
    expect(document.querySelector("[data-vaul-overlay]")?.className).toContain("z-overlay");
  });

  it("sizes side drawers from the side-width token", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="right" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const panel = screen.getByRole("dialog", { name: "Delivery details" });
    expect(panel.className).toContain("sm:max-w-drawer-side");
    expect(panel.className).not.toContain("sm:max-w-md");
  });

  it("styles handle, header, and footer from theme tokens", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHandle data-testid="handle" />
          <DrawerHeader data-testid="header">
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter data-testid="footer">actions</DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    const handle = screen.getByTestId("handle");
    expect(handle.className).toContain("mt-4");
    expect(handle.className).toContain("h-drawer-handle-height");
    expect(handle.className).toContain("w-drawer-handle-width");
    expect(handle.className).not.toMatch(/(^|\s)(h-1\.5|w-12)(\s|$)/);
    const header = screen.getByTestId("header");
    expect(header.className).toContain("gap-drawer-header-gap");
    expect(header.className).toContain("p-4");
    const footer = screen.getByTestId("footer");
    expect(footer.className).toContain("gap-2");
    expect(footer.className).not.toContain("gap-drawer-footer-gap");
    expect(footer.className).toContain("px-4");
    expect(footer.className).toContain("pb-drawer-footer-safe");
  });

  it("carries no value arbitraries on content, overlay, or chrome", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer direction="bottom" />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    const classes = [
      dialog.className,
      document.querySelector("[data-vaul-overlay]")?.className ?? "",
    ];
    for (const className of classes) {
      assertNoValueArbitraries(className);
    }
  });

  it("renders open on mount with defaultOpen", () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Delivery details</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
  });

  it("moves focus inside on open so the trap engages", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <OpenDrawer />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("traps Tab inside a modal drawer", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerTitle>Delivery details</DrawerTitle>
            <button type="button">first</button>
            <button type="button">second</button>
          </DrawerContent>
        </Drawer>
        <button type="button">after</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = screen.getByRole("dialog", { name: "Delivery details" });
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("returns focus to the trigger after Escape", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Delivery details" }).contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not mount-autofocus when modal is false", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">outside</button>
        <Drawer modal={false}>
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent modal={false}>
            <DrawerTitle>Delivery details</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Delivery details" })).not.toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<OpenDrawer />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const results = await axe(document.body, {
      rules: {
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
        "document-title": { enabled: false },
        "html-has-lang": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
