import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { stubDrawerJsdom } from "./drawer-fixture.js";
import { IDENTITY_BOOTSTRAP_SOURCE } from "#identity-bootstrap.js";
import {
  CUSTOM_IDENTITY_ID,
  IDENTITY_CUSTOM_STORAGE_KEY,
  IDENTITY_STORAGE_KEY,
  IdentityPicker,
  IdentityScript,
  IdentitySwitcher,
  applyCustomIdentity,
  applyIdentity,
  discardCustomIdentity,
  identities,
  identityPresets,
  isNamedIdentityId,
  type IdentityOption,
} from "#index.js";

/** Consumer-defined identities, passed instead of the built-in list. */
const looks: readonly IdentityOption[] = [
  { id: "calm", label: "Calm", description: "Soft and quiet." },
  { id: "bold", label: "Bold", description: "Loud and square." },
];

beforeAll(() => {
  stubDrawerJsdom();
});

afterEach(() => {
  document.documentElement.removeAttribute("data-identity");
  localStorage.clear();
  for (const sheet of document.querySelectorAll('style[data-slot="identity-custom-sheet"]')) sheet.remove();
});

function runScript(element: ReactElement) {
  const { container, unmount } = render(element);
  const script = container.querySelector('script[data-slot="identity-script"]') as HTMLScriptElement;
  const code = script.innerHTML;
  Object.defineProperty(document, "currentScript", { value: script, configurable: true });
  new Function(code)();
  unmount();
}

describe("IdentityScript", () => {
  it("is not a client module, so a server layout can render it without hydrating", () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../src/identity-script.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/^["']use client["']/m);
  });

  it("keeps a fixed bootstrap body and passes props only through data attributes", () => {
    const { container, unmount } = render(
      <IdentityScript ids={['a","b']} storageKey={'key"with'} defaultIdentity="calm" />,
    );
    const script = container.querySelector('script[data-slot="identity-script"]') as HTMLScriptElement;
    expect(script.innerHTML).toBe(IDENTITY_BOOTSTRAP_SOURCE);
    expect(script.getAttribute("data-ids")).toBe(JSON.stringify(['a","b']));
    expect(script.getAttribute("data-storage-key")).toBe('key"with');
    expect(script.getAttribute("data-custom-key")).toBe('key"with-custom');
    expect(script.getAttribute("data-default")).toBe("calm");
    unmount();
  });

  it("leaves the stock look when nothing is stored and there is no default", () => {
    runScript(<IdentityScript ids={["calm", "bold"]} />);
    expect(document.documentElement.hasAttribute("data-identity")).toBe(false);
  });

  it("applies a stored id that is allowed", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "bold");
    runScript(<IdentityScript ids={["calm", "bold"]} />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
  });

  it("ignores an unknown stored id and falls back to the default", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "nope");
    runScript(<IdentityScript ids={["calm", "bold"]} defaultIdentity="calm" />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("calm");
  });

  it("ships the six built-in identities, each with a label, a description and fonts", () => {
    expect(identities.map((item) => item.id)).toEqual(["mist", "press", "tide", "volt", "maison", "glass"]);
    for (const item of identities) {
      expect(item.label).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.fonts?.length).toBeGreaterThan(0);
    }
  });

  it("applies a stored built-in id by default and ignores anything else", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "press");
    runScript(<IdentityScript />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("press");
    document.documentElement.removeAttribute("data-identity");
    localStorage.setItem(IDENTITY_STORAGE_KEY, "bold");
    runScript(<IdentityScript />);
    expect(document.documentElement.hasAttribute("data-identity")).toBe(false);
  });

  it("honours opt-in before applying a stored id", () => {
    localStorage.setItem("my-look", "bold");
    runScript(<IdentityScript ids={["calm", "bold"]} storageKey="my-look" optInStorageKey="my-opt-in" />);
    expect(document.documentElement.hasAttribute("data-identity")).toBe(false);
    localStorage.setItem("my-opt-in", "1");
    runScript(<IdentityScript ids={["calm", "bold"]} storageKey="my-look" optInStorageKey="my-opt-in" defaultIdentity="calm" />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
  });

  it("honours a custom storage key", () => {
    localStorage.setItem("my-look", "calm");
    runScript(<IdentityScript ids={["calm"]} storageKey="my-look" />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("calm");
  });

  it("applies a stored custom sheet on the stored look", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "press");
    localStorage.setItem(IDENTITY_CUSTOM_STORAGE_KEY, ":root{--spacing:0.5rem}");
    runScript(<IdentityScript />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("press");
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toBe(
      ":root{--spacing:0.5rem}",
    );
  });

  it("restores a named identity id that is not in the allowlist when a sheet is stored", () => {
    localStorage.setItem(IDENTITY_STORAGE_KEY, "n-acme");
    localStorage.setItem(IDENTITY_CUSTOM_STORAGE_KEY, ':root[data-identity="n-acme"]{--spacing:0.4rem}');
    runScript(<IdentityScript />);
    expect(document.documentElement.getAttribute("data-identity")).toBe("n-acme");
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      "--spacing:0.4rem",
    );
  });
});

describe("IdentitySwitcher", () => {
  it("renders nothing without identities", () => {
    const { container } = render(<IdentitySwitcher identities={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("offers the built-in identities by default", () => {
    render(<IdentitySwitcher />);
    const options = [...(screen.getByLabelText("Identity") as HTMLSelectElement).options].map((option) => option.value);
    expect(options).toEqual(identities.map((item) => item.id));
  });

  it("has an accessible name and no axe violations", async () => {
    const { container } = render(<IdentitySwitcher identities={looks} />);
    expect(screen.getByLabelText("Identity")).toBeTruthy();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("sets data-identity on the root, persists the choice and reports it", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<IdentitySwitcher identities={looks} onIdentityChange={(id) => seen.push(id)} />);
    await user.selectOptions(screen.getByLabelText("Identity"), "bold");
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
    expect(localStorage.getItem(IDENTITY_STORAGE_KEY)).toBe("bold");
    expect(seen).toEqual(["bold"]);
  });

  it("follows a change made elsewhere on the page", async () => {
    render(<IdentitySwitcher identities={looks} />);
    act(() => applyIdentity("bold"));
    expect(await screen.findByDisplayValue("Bold")).toBeTruthy();
  });

  it("shows Custom while a custom sheet is active and parks it when a built-in is chosen", async () => {
    const user = userEvent.setup();
    render(<IdentitySwitcher identities={looks} />);
    act(() => {
      applyCustomIdentity(identityPresets.mist);
    });
    expect(await screen.findByDisplayValue("Custom")).toBeTruthy();
    expect(document.documentElement.getAttribute("data-identity")).toBe(CUSTOM_IDENTITY_ID);
    act(() => {
      applyCustomIdentity(identityPresets.press, "press");
    });
    expect(document.documentElement.getAttribute("data-identity")).toBe("press");
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `:root[data-identity="press"]`,
    );
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `--sidebar: ${identityPresets.press.light.background}`,
    );
    await user.selectOptions(screen.getByLabelText("Identity"), "bold");
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
    // Parked, not wiped: the press-scoped sheet survives the switch and is
    // still there (inert under bold) when its look is chosen again.
    expect(localStorage.getItem(IDENTITY_CUSTOM_STORAGE_KEY)).toContain(`:root[data-identity="press"]`);
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `:root[data-identity="press"]`,
    );
    act(() => applyIdentity("press"));
    expect(document.documentElement.getAttribute("data-identity")).toBe("press");
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `--sidebar: ${identityPresets.press.light.background}`,
    );
  });

  it("discardCustomIdentity clears the stored sheet and the live sheet", () => {
    act(() => {
      applyCustomIdentity(identityPresets.press, "press");
    });
    expect(localStorage.getItem(IDENTITY_CUSTOM_STORAGE_KEY)).toContain("press");
    act(() => discardCustomIdentity());
    expect(localStorage.getItem(IDENTITY_CUSTOM_STORAGE_KEY)).toBeNull();
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent ?? "").toBe("");
  });

  it("scopes a look-less custom sheet to the custom look", () => {
    act(() => {
      applyCustomIdentity(identityPresets.mist);
    });
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `:root[data-identity="${CUSTOM_IDENTITY_ID}"]`,
    );
  });

  it("applies a named identity without dropping the custom sheet", () => {
    act(() => {
      applyCustomIdentity(identityPresets.maison, "n-acme");
    });
    expect(document.documentElement.getAttribute("data-identity")).toBe("n-acme");
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `:root[data-identity="n-acme"]`,
    );
    expect(document.querySelector('style[data-slot="identity-custom-sheet"]')?.textContent).toContain(
      `--sidebar: ${identityPresets.maison.light.background}`,
    );
    act(() => applyIdentity("n-acme"));
    expect(localStorage.getItem(IDENTITY_CUSTOM_STORAGE_KEY)).toContain(":root[data-identity=\"n-acme\"]");
  });

  it("names a named identity in the select while the custom sheet stays", async () => {
    render(<IdentitySwitcher identities={looks} />);
    act(() => {
      applyCustomIdentity(identityPresets.maison, "n-acme");
    });
    const select = (await screen.findByLabelText("Identity")) as HTMLSelectElement;
    expect(select.value).toBe("n-acme");
    expect([...select.options].map((option) => option.value)).toEqual(["n-acme", "calm", "bold"]);
    expect(screen.getByDisplayValue("acme")).toBeTruthy();
  });
});

describe("IdentityPicker", () => {
  it("renders nothing without identities", () => {
    const { container } = render(<IdentityPicker identities={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("names the current identity and applies a choice from the sheet", async () => {
    const user = userEvent.setup();
    render(<IdentityPicker identities={looks} />);
    await user.click(screen.getByRole("button", { name: "Identity: Calm" }));
    const bold = await screen.findByRole("radio", { name: /Bold/ });
    expect(screen.getByRole("radio", { name: /Calm/ }).getAttribute("aria-checked")).toBe("true");
    await user.click(bold);
    expect(document.documentElement.getAttribute("data-identity")).toBe("bold");
    expect(localStorage.getItem(IDENTITY_STORAGE_KEY)).toBe("bold");
    expect(bold.getAttribute("aria-checked")).toBe("true");
  });

  it("names the trigger Custom while a custom sheet is active", async () => {
    render(<IdentityPicker identities={looks} />);
    act(() => {
      applyCustomIdentity(identityPresets.mist);
    });
    expect(await screen.findByRole("button", { name: "Identity: Custom" })).toBeTruthy();
  });

  it("names a named identity on the trigger and checks it in the sheet", async () => {
    const user = userEvent.setup();
    render(<IdentityPicker identities={looks} />);
    act(() => {
      applyCustomIdentity(identityPresets.maison, "n-acme");
    });
    await user.click(await screen.findByRole("button", { name: "Identity: acme" }));
    expect((await screen.findByRole("radio", { name: /^acme/ })).getAttribute("aria-checked")).toBe("true");
  });
});

describe("isNamedIdentityId", () => {
  it("matches the n- prefix only", () => {
    expect(isNamedIdentityId("n-acme")).toBe(true);
    expect(isNamedIdentityId("n-")).toBe(true);
    expect(isNamedIdentityId("maison")).toBe(false);
    expect(isNamedIdentityId("custom")).toBe(false);
    expect(isNamedIdentityId("N-acme")).toBe(false);
  });
});
