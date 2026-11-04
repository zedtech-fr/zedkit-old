import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Button, Container, Section, SectionScroll, Stack } from "#index.js";

describe("layout", () => {
  it("stacks children vertically or horizontally with gaps", () => {
    const { container } = render(
      <>
        <Stack data-testid="v">
          <span>a</span>
        </Stack>
        <Stack data-testid="h" direction="horizontal" gap={2}>
          <span>a</span>
        </Stack>
      </>,
    );
    const vertical = container.querySelector('[data-testid="v"]');
    expect(vertical?.className).toContain("flex-col");
    expect(vertical?.className).toContain("gap-4");
    const horizontal = container.querySelector('[data-testid="h"]');
    expect(horizontal?.className).toContain("flex-row");
    expect(horizontal?.className).toContain("gap-2");
  });

  it("renders a titled section with description, actions, and content", () => {
    render(
      <Section title="Team" description="Who can access." actions={<Button size="sm">Invite</Button>}>
        <Badge>Ada</Badge>
      </Section>,
    );
    expect(screen.getByRole("heading", { name: "Team", level: 2 })).not.toBeNull();
    expect(screen.getByText("Who can access.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Invite" })).not.toBeNull();
    expect(screen.getByText("Ada")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Team" })).not.toBeNull();
  });

  it("still shows a description when there is no title", () => {
    render(<Section description="Who can access." />);
    expect(screen.getByText("Who can access.")).not.toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("lets a consumer aria-label win over the title name", () => {
    render(<Section title="Team" aria-label="People" />);
    expect(screen.getByRole("region", { name: "People" })).not.toBeNull();
  });

  it("keeps the whole stack gap scale on default spacing with no arbitrary values", () => {
    const { container } = render(
      <>
        {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((gap) => (
          <Stack key={gap} data-testid={`gap-${gap}`} gap={gap}>
            <span>a</span>
          </Stack>
        ))}
        <Section data-testid="section" title="Team">
          <span>a</span>
        </Section>
      </>,
    );
    for (const gap of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const className = container.querySelector(`[data-testid="gap-${gap}"]`)?.className ?? "";
      expect(className).toContain(`gap-${gap}`);
      expect(className).not.toContain("[");
    }
    expect(container.querySelector('[data-testid="section"]')?.className).toContain("space-y-4");
  });

  it("renders a bare section without a header", () => {
    const { container } = render(
      <Section>
        <span>Just content.</span>
      </Section>,
    );
    expect(container.querySelector("section")?.textContent).toContain("Just content.");
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("centers content at the default width with the page gutter", () => {
    const { container } = render(
      <Container data-testid="c">
        <span>a</span>
      </Container>,
    );
    const el = container.querySelector('[data-testid="c"]');
    expect(el?.getAttribute("data-slot")).toBe("container");
    expect(el?.className).toContain("mx-auto");
    expect(el?.className).toContain("w-full");
    expect(el?.className).toContain("max-w-default");
    expect(el?.className).toContain("px-page-gutter");
  });

  it("renders every container width with literal classes", () => {
    const widths = {
      narrow: "max-w-narrow",
      reading: "max-w-reading",
      default: "max-w-default",
      wide: "max-w-wide",
      full: "max-w-none",
    } as const;
    const { container } = render(
      <>
        {(Object.keys(widths) as Array<keyof typeof widths>).map((width) => (
          <Container key={width} data-testid={`w-${width}`} width={width}>
            <span>a</span>
          </Container>
        ))}
      </>,
    );
    for (const [width, klass] of Object.entries(widths)) {
      const className = container.querySelector(`[data-testid="w-${width}"]`)?.className ?? "";
      expect(className).toContain(klass);
      expect(className).not.toContain("[");
    }
  });

  it("drops the gutter when gutter is false but keeps centering", () => {
    const { container } = render(
      <Container data-testid="c" gutter={false}>
        <span>a</span>
      </Container>,
    );
    const className = container.querySelector('[data-testid="c"]')?.className ?? "";
    expect(className).toContain("mx-auto");
    expect(className).toContain("max-w-default");
    expect(className).not.toContain("px-page-gutter");
  });

  it("lets a consumer className win width conflicts and passes html props through", () => {
    const { container } = render(
      <Container data-testid="c" id="shell" aria-label="Page" className="max-w-sm px-2" />,
    );
    const el = container.querySelector('[data-testid="c"]');
    expect(el?.id).toBe("shell");
    expect(el?.getAttribute("aria-label")).toBe("Page");
    expect(el?.className).toContain("max-w-sm");
    expect(el?.className).not.toContain("max-w-default");
    expect(el?.className).toContain("px-2");
    expect(el?.className).not.toContain("px-page-gutter");
  });

  it("lets a consumer className win the bleed spacing conflict", () => {
    const { container } = render(
      <Section data-testid="s" bleed className="py-2">
        <span>a</span>
      </Section>,
    );
    const el = container.querySelector('[data-testid="s"]');
    expect(el?.className).toContain("py-2");
    expect(el?.className).not.toContain("py-section-md");
  });

  it("keeps the non-bleed section byte-identical (no container, plain rhythm)", () => {
    const { container } = render(
      <Section data-testid="s">
        <span>a</span>
      </Section>,
    );
    const el = container.querySelector('[data-testid="s"]');
    expect(el?.className).toBe("space-y-4");
    expect(container.querySelector('[data-slot="container"]')).toBeNull();
  });

  it("bleeds a section edge to edge with capped inner content", () => {
    const { container } = render(
      <Section data-testid="s" bleed title="Team" description="Who can access." actions={<Button size="sm">Invite</Button>}>
        <Badge>Ada</Badge>
      </Section>,
    );
    const el = container.querySelector('[data-testid="s"]');
    expect(el?.className).toContain("w-full");
    expect(el?.className).toContain("py-section-md");
    expect(el?.className).not.toContain("bg-muted");
    const inner = el?.querySelector('[data-slot="container"]');
    expect(inner).not.toBeNull();
    expect(inner?.className).toContain("max-w-default");
    expect(inner?.textContent).toContain("Ada");
    expect(screen.getByRole("heading", { name: "Team", level: 2 })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Invite" })).not.toBeNull();
  });

  it("renders every bleed spacing step with literal classes", () => {
    const steps = {
      sm: "py-section-sm",
      md: "py-section-md",
      lg: "py-section-lg",
      xl: "py-section-xl",
    } as const;
    const { container } = render(
      <>
        {(Object.keys(steps) as Array<keyof typeof steps>).map((spacing) => (
          <Section key={spacing} data-testid={`s-${spacing}`} bleed spacing={spacing}>
            <span>a</span>
          </Section>
        ))}
      </>,
    );
    for (const [spacing, klass] of Object.entries(steps)) {
      const className = container.querySelector(`[data-testid="s-${spacing}"]`)?.className ?? "";
      expect(className).toContain(klass);
      expect(className).not.toContain("[");
    }
  });

  it("ignores tone, spacing and containerWidth when bleed is off", () => {
    const { container } = render(
      <Section data-testid="s" tone="muted" spacing="xl" containerWidth="wide">
        <span>a</span>
      </Section>,
    );
    const el = container.querySelector('[data-testid="s"]');
    expect(el?.className).toBe("space-y-4");
    expect(container.querySelector('[data-slot="container"]')).toBeNull();
  });

  it("applies the muted tone, the spacing scale and containerWidth in bleed mode", () => {
    const { container } = render(
      <Section data-testid="s" bleed tone="muted" spacing="lg" containerWidth="wide">
        <span>a</span>
      </Section>,
    );
    const el = container.querySelector('[data-testid="s"]');
    expect(el?.className).toContain("bg-muted");
    expect(el?.className).toContain("py-section-lg");
    expect(el?.querySelector('[data-slot="container"]')?.className).toContain("max-w-wide");
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("defaults sections to start snap and can opt out", () => {
    const { container, rerender } = render(
      <Section data-testid="s" title="Team">
        <span>a</span>
      </Section>,
    );
    expect(container.querySelector('[data-testid="s"]')?.getAttribute("data-snap")).toBe("start");
    rerender(
      <Section data-testid="s" snap="none" title="Team">
        <span>a</span>
      </Section>,
    );
    expect(container.querySelector('[data-testid="s"]')?.getAttribute("data-snap")).toBe("none");
  });

  it("marks a scroll root for section snap", () => {
    const { container } = render(
      <SectionScroll data-testid="root">
        <Section title="Team" />
      </SectionScroll>,
    );
    expect(container.querySelector('[data-testid="root"]')?.getAttribute("data-slot")).toBe("section-scroll");
  });
});
