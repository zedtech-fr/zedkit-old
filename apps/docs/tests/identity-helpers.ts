import { expect, type Page } from "@playwright/test";

/** Opt-in docs site look before navigation (replaces legacy `zk-identity` for shell tests). */
export async function persistDocsSiteLook(page: Page, identity: string, theme: "light" | "dark") {
  await page.addInitScript(
    ({ id, mode }) => {
      localStorage.setItem("zk-docs-site-identity", id);
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
      localStorage.setItem("theme", mode);
    },
    { id: identity, mode: theme },
  );
}

/** Sets `data-identity` and colour mode on `<html>`, then waits for fonts. */
export async function useIdentity(page: Page, identity: string | null, theme: "light" | "dark") {
  await page.evaluate(
    ({ id, mode }) => {
      const root = document.documentElement;
      if (id) root.setAttribute("data-identity", id);
      else root.removeAttribute("data-identity");
      root.classList.toggle("dark", mode === "dark");
      root.classList.toggle("light", mode === "light");
      root.style.colorScheme = mode;
      void root.offsetHeight;
      // Identity colour transitions (180ms) leave nav mid-gray; axe samples that frame.
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
    },
    { id: identity, mode: theme },
  );
  await page.evaluate(() => document.fonts.ready);
}

/** Wait until html has this identity and colour mode, and in-document fonts are loaded. */
export async function waitForAppliedLook(page: Page, identity: string, theme: "light" | "dark"): Promise<void> {
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-identity", identity);
  await expect(root).toHaveClass(new RegExp(`\\b${theme}\\b`));
  await page.evaluate(async () => {
    const specs = new Set<string>();
    for (const el of document.querySelectorAll("html, [data-identity], [data-identity-scope]")) {
      const { fontFamily, fontSize, fontWeight } = getComputedStyle(el);
      const family = fontFamily.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
      if (family) specs.add(`${fontWeight} ${fontSize} "${family}"`);
    }
    await Promise.all([...specs].map((spec) => document.fonts.load(spec)));
    await document.fonts.ready;
  });
}

/**
 * Computed value of a CSS expression, read through a probe in `<main>`.
 * Pass `identity` to resolve tokens on a ThemeScope-shaped node: site chrome
 * pins radii/shadows on `:root`, so an unscoped probe does not prove a look.
 */
export async function probe(page: Page, property: string, value: string, identity?: string) {
  return page.evaluate(
    ([prop, val, id]) => {
      const host = document.createElement(id ? "div" : "span");
      let el: HTMLElement = host;
      if (id) {
        host.setAttribute("data-identity-scope", "");
        host.setAttribute("data-identity", id);
        if (document.documentElement.classList.contains("dark")) host.classList.add("dark");
        el = document.createElement("span");
        host.appendChild(el);
      }
      el.style.setProperty(prop, val);
      document.querySelector("main")!.appendChild(host);
      const out = getComputedStyle(el).getPropertyValue(prop);
      host.remove();
      return out;
    },
    [property, value, identity ?? ""] as const,
  );
}
