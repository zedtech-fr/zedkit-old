import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#index.js";

function DemoTabs() {
  return (
    <Tabs defaultValue="one">
      <TabsList aria-label="Demo">
        <TabsTrigger value="one">First</TabsTrigger>
        <TabsTrigger value="two">Second</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel.</TabsContent>
      <TabsContent value="two">Second panel.</TabsContent>
    </Tabs>
  );
}

describe("tabs", () => {
  it("shows the default panel, then switches on trigger click", async () => {
    const user = userEvent.setup();
    render(<DemoTabs />);

    expect(screen.getByText("First panel.")).not.toBeNull();
    expect(screen.queryByText("Second panel.")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Second" }));
    expect(await screen.findByText("Second panel.")).not.toBeNull();
    expect(screen.getByRole("tab", { name: "Second" }).getAttribute("data-state")).toBe("active");
  });

  it("styles list, trigger, and content from design tokens", () => {
    render(<DemoTabs />);
    const list = screen.getByRole("tablist");
    expect(list.classList.contains("h-tabs-list-height")).toBe(true);
    expect(list.classList.contains("p-tabs-list-inset")).toBe(true);
    expect(list.className).not.toMatch(/(^|\s)(h-9|p-1)(\s|$)/);
    const trigger = screen.getByRole("tab", { name: "First" });
    expect(trigger.className).toContain("px-3");
    expect(trigger.className).not.toContain("px-tabs-trigger-inline");
    expect(trigger.classList.contains("py-tabs-trigger-block")).toBe(true);
    expect(trigger.classList.contains("focus-ring")).toBe(true);
    // Drawn inside the trigger: the list scrolls sideways, and a ring outside its padding box would be cut off.
    expect(trigger.className).toContain("focus-visible:-outline-offset-(--ring-width)");
    expect(trigger.className).not.toMatch(/(^|\s)(py-1|ring-2)(\s|$)/);
    const panel = screen.getByText("First panel.");
    expect(panel.className).toContain("mt-2");
    expect(panel.className).toContain("focus-ring");
    expect(panel.className).not.toContain("mt-tabs-content-gap");
    expect(panel.className).not.toMatch(/(^|\s)ring-2(\s|$)/);
  });

  it("scrolls horizontally instead of clipping on narrow widths", () => {
    render(<DemoTabs />);
    const list = screen.getByRole("tablist");
    expect(list.classList.contains("max-w-full")).toBe(true);
    expect(list.classList.contains("overflow-x-auto")).toBe(true);
  });
});
