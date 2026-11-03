import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityDock, IdentityDockPanel, IdentityDockSwatch, IdentityDockTrigger } from "#identity-dock.js";

describe("IdentityDock", () => {
  it("exposes data-slot on the chrome parts", () => {
    const { container } = render(
      <IdentityDock>
        <IdentityDockTrigger type="button">Open</IdentityDockTrigger>
        <IdentityDockPanel open>
          <IdentityDockSwatch />
        </IdentityDockPanel>
      </IdentityDock>,
    );
    expect(container.querySelector("[data-slot='identity-dock']")).toBeTruthy();
    expect(container.querySelector("[data-slot='identity-dock-trigger']")).toBeTruthy();
    expect(container.querySelector("[data-slot='identity-dock-panel']")).toBeTruthy();
    expect(container.querySelector("[data-slot='identity-dock-swatch']")).toBeTruthy();
  });
});
