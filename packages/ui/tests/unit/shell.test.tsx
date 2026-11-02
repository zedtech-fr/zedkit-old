import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell, PageHeader } from "#index.js";

describe("AppShell", () => {
  it("renders sidebar, topbar, and main slots", () => {
    render(
      <AppShell sidebar={<nav>Nav</nav>} topbar={<div>Top</div>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByText("Nav").textContent).toBe("Nav");
    expect(screen.getByText("Top").textContent).toBe("Top");
    expect(screen.getByText("Content").textContent).toBe("Content");
  });

  it("omits the header when no topbar is given", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(container.querySelector("header")).toBeNull();
  });

  it("sizes sidebar and main padding from theme tokens", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(container.querySelector("aside")?.className).toContain("w-app-shell-sidebar");
    expect(container.querySelector("aside")?.className).toContain("flex-col");
    expect(container.querySelector("main")?.className).toContain("p-4");
    expect(container.querySelector("main")?.className).toContain("md:p-app-shell-padding-md");
    expect(container.querySelector("main")?.className).toContain("overflow-y-auto");
  });

  it("hides the sidebar below md with a single display rule, so no base rule can win on desktop", () => {
    const { container } = render(
      <AppShell sidebar={<nav>Nav</nav>}>
        <p>Content</p>
      </AppShell>,
    );
    const classes = container.querySelector("aside")?.className.split(" ") ?? [];
    expect(classes).toContain("max-md:hidden");
    expect(classes).not.toContain("hidden");
    expect(classes).not.toContain("md:block");
  });
});

describe("PageHeader", () => {
  it("renders title, description, and actions", () => {
    render(<PageHeader title="Items" description="All items." actions={<button type="button">New</button>} />);
    expect(screen.getByRole("heading", { name: "Items" }).textContent).toBe("Items");
    expect(screen.getByText("All items.").textContent).toBe("All items.");
    expect(screen.getByRole("button", { name: "New" }).textContent).toBe("New");
  });

  it("uses the token-driven title spacing with no arbitrary values", () => {
    const { container } = render(<PageHeader title="Items" description="All items." />);
    expect(container.firstElementChild?.className).toContain("gap-page-header-title-gap");
    expect(container.firstElementChild?.className).not.toContain("[");
  });

  it("spaces chrome from page-header tokens", () => {
    const { container } = render(
      <PageHeader title="Items" description="All items." actions={<button type="button">New</button>} />,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("mb-page-header-offset");
    expect(root?.className).toContain("gap-page-header-title-gap");
    expect(root?.className).not.toMatch(/(^|\s)mb-6(\s|$)/);
    const titleRow = screen.getByRole("heading", { name: "Items" }).parentElement;
    expect(titleRow?.className).toContain("gap-4");
    const actions = screen.getByRole("button", { name: "New" }).parentElement;
    expect(actions?.className).toContain("gap-2");
    expect(actions?.className).not.toContain("gap-page-header-actions-gap");
  });
});
