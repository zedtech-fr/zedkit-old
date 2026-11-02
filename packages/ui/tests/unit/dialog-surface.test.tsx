import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "#index.js";
import { ConfirmDialog } from "#index.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#index.js";

function isTransparentOrSame(bg: string, panelBg: string): boolean {
  return bg === "transparent" || bg === "rgba(0, 0, 0, 0)" || bg === panelBg;
}

describe("dialog overlay surface (D5)", () => {
  it("keeps header and footer backgrounds transparent against the panel", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const panel = screen.getByRole("dialog");
    const header = panel.querySelector('[data-slot="dialog-header"]') as HTMLElement;
    const footer = panel.querySelector('[data-slot="dialog-footer"]') as HTMLElement;
    const panelBg = getComputedStyle(panel).backgroundColor;
    expect(isTransparentOrSame(getComputedStyle(header).backgroundColor, panelBg)).toBe(true);
    expect(isTransparentOrSame(getComputedStyle(footer).backgroundColor, panelBg)).toBe(true);
    expect(header.className).not.toContain("bg-background");
    expect(footer.className).not.toContain("bg-background");
    await user.tab();
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it("ConfirmDialog destructive action uses the destructive button variant", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<Button>Delete</Button>}
        title="Delete app?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm.className).toContain("bg-destructive");
  });
});
