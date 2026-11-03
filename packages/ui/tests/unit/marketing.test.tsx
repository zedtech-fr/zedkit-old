import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import * as Marketing from "#marketing/index.js";
import { userEvent } from "@testing-library/user-event";
import { ZedkitUiProvider, zedkitUiMessagesFr } from "#index.js";
import {
  CtaBand,
  FeatureGrid,
  GlassSurface,
  Hero,
  HowItWorks,
  LocaleSwitch,
  MarketingFooter,
  MarketingHeader,
} from "#marketing/index.js";
import { assertNoValueArbitraries } from "./no-arbitraries.js";

describe("marketing entry", () => {
  const components = Object.entries(Marketing).filter(
    ([name, value]) => typeof value === "function" && /^[A-Z]/.test(name),
  );

  it.each(components)("%s source includes data-slot", (_name, value) => {
    expect(Function.prototype.toString.call(value)).toContain("data-slot");
  });
});

describe("GlassSurface", () => {
  it("renders children on the card colour so the glass identity applies", () => {
    render(<GlassSurface>Hello</GlassSurface>);
    const node = screen.getByText("Hello");
    expect(node.getAttribute("data-slot")).toBe("glass-surface");
    expect(node.className).toContain("bg-card");
    expect(node.className).toContain("p-6");
  });

  it("switches tone and padding", () => {
    render(
      <GlassSurface tone="tinted" padding="lg">
        Tinted
      </GlassSurface>,
    );
    const node = screen.getByText("Tinted");
    expect(node.className).toContain("from-accent/15");
    expect(node.className).toContain("p-8");
    expect(node.className).not.toContain("p-6");
  });

  it("renders the requested element and forwards props", () => {
    render(
      <GlassSurface as="section" aria-label="Plans" className="mt-4">
        Plans
      </GlassSurface>,
    );
    const node = screen.getByLabelText("Plans");
    expect(node.tagName).toBe("SECTION");
    expect(node.className).toContain("mt-4");
  });

  it("uses no raw arbitrary values and has no axe violations", async () => {
    const { container } = render(
      <>
        <GlassSurface tone="plain">A</GlassSurface>
        <GlassSurface tone="raised">B</GlassSurface>
        <GlassSurface tone="tinted">C</GlassSurface>
      </>,
    );
    for (const node of container.querySelectorAll("[data-slot='glass-surface']")) {
      assertNoValueArbitraries(node.className);
    }
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("Hero", () => {
  it("renders the title as the page heading and labels the section with it", () => {
    render(<Hero title="Keep your shop" description="Add live updates." />);
    const heading = screen.getByRole("heading", { level: 1, name: "Keep your shop" });
    const region = screen.getByRole("region", { name: "Keep your shop" });
    expect(region.getAttribute("data-slot")).toBe("hero");
    expect(region.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(screen.getByText("Add live updates.")).toBeTruthy();
  });

  it("renders eyebrow, actions and media only when given", () => {
    const { rerender, container } = render(<Hero title="T" />);
    expect(container.querySelector("[data-slot='hero-actions']")).toBeNull();
    expect(container.querySelector("[data-slot='hero-media']")).toBeNull();
    rerender(
      <Hero title="T" eyebrow="New" actions={<a href="/signup">Create an account</a>} media={<p>Demo</p>} />,
    );
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeTruthy();
    expect(container.querySelector("[data-slot='hero-media']")?.textContent).toBe("Demo");
  });

  it("uses a level-2 heading when asked, and left-aligns on request", () => {
    const { container } = render(<Hero title="T" headingLevel={2} align="start" />);
    expect(screen.getByRole("heading", { level: 2, name: "T" })).toBeTruthy();
    expect(container.innerHTML).not.toContain("text-center");
  });

  it("gives two heroes distinct heading ids", () => {
    render(
      <>
        <Hero title="One" />
        <Hero title="Two" />
      </>,
    );
    expect(screen.getByRole("heading", { name: "One" }).id).not.toBe(screen.getByRole("heading", { name: "Two" }).id);
  });
});

describe("CtaBand", () => {
  it("renders a labelled region with a level-2 heading and actions", () => {
    render(<CtaBand title="Start today" description="No card needed." actions={<a href="/signup">Create an account</a>} />);
    const region = screen.getByRole("region", { name: "Start today" });
    expect(region.getAttribute("data-slot")).toBe("cta-band");
    expect(screen.getByRole("heading", { level: 2, name: "Start today" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create an account" })).toBeTruthy();
  });

  it("sits on a tinted glass surface and has no axe violations with Hero", async () => {
    const { container } = render(
      <main>
        <Hero title="Keep your shop" description="Add live updates." actions={<a href="/signup">Create an account</a>} />
        <CtaBand title="Start today" actions={<a href="/signup">Create an account</a>} />
      </main>,
    );
    expect(container.querySelector("[data-slot='cta-band'] [data-slot='glass-surface']")).not.toBeNull();
    for (const node of container.querySelectorAll("[class]")) {
      assertNoValueArbitraries(node.getAttribute("class") ?? "");
    }
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("FeatureGrid", () => {
  const features = [
    { title: "Live stock", description: "Counts follow every sale.", icon: <svg viewBox="0 0 1 1" /> },
    { title: "Offers" },
    { id: "assistant", title: "Assistant", description: "Answers from your catalog." },
  ];

  it("renders a labelled region, a level-2 title and one list item per feature", () => {
    render(<FeatureGrid title="What you get" description="Three things." features={features} />);
    const region = screen.getByRole("region", { name: "What you get" });
    expect(region.getAttribute("data-slot")).toBe("feature-grid");
    expect(screen.getByRole("heading", { level: 2, name: "What you get" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 3, name: "Live stock" })).toBeTruthy();
    expect(screen.getByText("Counts follow every sale.")).toBeTruthy();
  });

  it("hides the icon from assistive tech and skips empty parts", () => {
    const { container } = render(<FeatureGrid title="T" features={features} />);
    const icons = container.querySelectorAll("[data-slot='feature-icon']");
    expect(icons).toHaveLength(1);
    expect(icons[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("[data-slot='marketing-section-header'] p")).toBeNull();
  });

  it("picks the column count and handles an empty list", () => {
    const { container, rerender } = render(<FeatureGrid title="T" features={[]} columns={4} />);
    expect(container.querySelector("ul")?.className).toContain("lg:grid-cols-4");
    expect(container.querySelectorAll("li")).toHaveLength(0);
    rerender(<FeatureGrid title="T" features={[]} />);
    expect(container.querySelector("ul")?.className).toContain("lg:grid-cols-3");
  });
});

describe("HowItWorks", () => {
  it("renders numbered steps in order with a level-3 title each", () => {
    const { container } = render(
      <HowItWorks
        title="Three steps"
        steps={[
          { title: "Sign up", description: "Create an account." },
          { title: "Create a key" },
          { title: "See your first event" },
        ]}
      />,
    );
    expect(screen.getByRole("region", { name: "Three steps" }).getAttribute("data-slot")).toBe("how-it-works");
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.querySelector("h3")?.textContent)).toEqual([
      "Sign up",
      "Create a key",
      "See your first event",
    ]);
    expect([...container.querySelectorAll("li > span")].map((node) => node.textContent)).toEqual(["1", "2", "3"]);
    expect(container.querySelector("ol")).not.toBeNull();
  });

  it("has no axe violations next to a feature grid", async () => {
    const { container } = render(
      <main>
        <FeatureGrid title="Features" features={[{ title: "A", description: "a" }, { title: "B" }]} />
        <HowItWorks title="Steps" steps={[{ title: "One" }, { title: "Two", description: "b" }]} />
      </main>,
    );
    for (const node of container.querySelectorAll("[class]")) {
      assertNoValueArbitraries(node.getAttribute("class") ?? "");
    }
    expect((await axe(container)).violations).toEqual([]);
  });
});

const links = [<a key="a" href="/docs">Docs</a>, <a key="b" href="/pricing" aria-current="page">Pricing</a>];

describe("MarketingHeader", () => {
  it("renders brand, a named main navigation and actions", () => {
    render(<MarketingHeader brand={<a href="/">Harbor</a>} links={links} actions={<a href="/signin">Sign in</a>} />);
    expect(screen.getByRole("banner").getAttribute("data-slot")).toBe("marketing-header");
    expect(screen.getAllByRole("navigation", { name: "Main navigation" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Docs" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Sign in" })).toHaveLength(2);
    expect(screen.getByText("Menu")).toBeTruthy();
  });

  it("opens the phone menu from a native disclosure and speaks French through the provider", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <MarketingHeader brand="Harbor" links={links} />
      </ZedkitUiProvider>,
    );
    const details = container.querySelector("details");
    expect(details?.open).toBe(false);
    await user.click(screen.getByText("Menu"));
    expect(details?.open).toBe(true);
    expect(screen.getAllByRole("navigation", { name: "Navigation principale" }).length).toBeGreaterThan(0);
  });

  it("is sticky by default and can opt out; omits empty parts", () => {
    const { container, rerender } = render(<MarketingHeader brand="Harbor" />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("sticky");
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelector("[data-slot='marketing-header-actions']")).toBeNull();
    rerender(<MarketingHeader brand="Harbor" sticky={false} />);
    expect(container.querySelector("header")?.className).not.toContain("sticky");
  });
});

describe("MarketingFooter", () => {
  it("renders brand, description, labelled link columns and the legal line", () => {
    render(
      <MarketingFooter
        brand={<a href="/">Harbor</a>}
        description="Live features for your shop."
        columns={[
          { title: "Product", links },
          { title: "Company", links: [<a key="c" href="/about">About</a>] },
        ]}
        legal={<p>© 2026 Harbor</p>}
      />,
    );
    expect(screen.getByRole("contentinfo").getAttribute("data-slot")).toBe("marketing-footer");
    expect(screen.getByRole("navigation", { name: "Product" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Company" })).toBeTruthy();
    expect(screen.getByText("© 2026 Harbor")).toBeTruthy();
    expect(screen.getByText("Live features for your shop.")).toBeTruthy();
  });

  it("renders with nothing but a legal line", () => {
    const { container } = render(<MarketingFooter legal={<p>© 2026</p>} />);
    expect(container.querySelector("nav")).toBeNull();
    expect(screen.getByText("© 2026")).toBeTruthy();
  });
});

describe("LocaleSwitch", () => {
  const locales = [
    { code: "en", label: "English", href: "/en" },
    { code: "fr", label: "Français", href: "/fr" },
  ];

  it("marks the current language and sets lang on each item", () => {
    render(<LocaleSwitch locales={locales} current="fr" />);
    expect(screen.getByRole("navigation", { name: "Language" })).toBeTruthy();
    const fr = screen.getByRole("link", { name: "Français" });
    expect(fr.getAttribute("aria-current")).toBe("true");
    expect(fr.getAttribute("lang")).toBe("fr");
    expect(fr.getAttribute("hreflang")).toBe("fr");
    expect(screen.getByRole("link", { name: "English" }).getAttribute("aria-current")).toBeNull();
  });

  it("renders buttons without an href and calls onSelect with the code", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <LocaleSwitch
        locales={[
          { code: "en", label: "English" },
          { code: "fr", label: "Français" },
        ]}
        current="en"
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(onSelect).toHaveBeenCalledWith("fr");
    expect(screen.getByRole("button", { name: "English" }).getAttribute("aria-current")).toBe("true");
  });

  it("calls onSelect from a link too, and the name follows the provider language", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(code: string) => void>();
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <LocaleSwitch locales={locales} current="en" onSelect={onSelect} />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Langue" })).toBeTruthy();
    const link = screen.getByRole("link", { name: "Français" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(onSelect).toHaveBeenCalledWith("fr");
  });

  it("has no axe violations inside a page frame", async () => {
    const { container } = render(
      <>
        <MarketingHeader brand={<a href="/">Harbor</a>} links={links} actions={<LocaleSwitch locales={locales} current="en" />} />
        <main>
          <Hero title="Keep your shop" />
        </main>
        <MarketingFooter brand={<a href="/">Harbor</a>} columns={[{ title: "Product", links }]} legal={<p>© 2026</p>} />
      </>,
    );
    for (const node of container.querySelectorAll("[class]")) {
      assertNoValueArbitraries(node.getAttribute("class") ?? "");
    }
    expect((await axe(container)).violations).toEqual([]);
  });
});
