import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "#index.js";
import { Alert, AlertDescription, AlertTitle } from "#index.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#index.js";
import { Button } from "#index.js";
import { Input } from "#index.js";
import { Label } from "#index.js";
import { Separator } from "#index.js";
import { Skeleton } from "#index.js";
import { Heading, Text } from "#index.js";
import { Textarea } from "#index.js";

describe("primitives", () => {
  it("uses a quiet ghost hover (muted tint, not accent fill)", () => {
    render(<Button variant="ghost">Quiet</Button>);
    const button = screen.getByRole("button", { name: "Quiet" });
    expect(button.className).toContain("hover:bg-muted/80");
    expect(button.className).not.toContain("hover:bg-accent");
  });

  it("uses underline-only link styling without a hover fill", () => {
    render(
      <Button asChild variant="link" size="sm">
        <a href="/docs">Read docs</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Read docs" });
    expect(link.className).toContain("hover:underline");
    expect(link.className).toContain("hover:bg-transparent");
    expect(link.className).not.toContain("hover:bg-accent");
    expect(link.className).toContain("min-h-11");
  });

  it("takes ref as a prop", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Save");
    expect(ref.current?.getAttribute("data-slot")).toBe("button");
  });

  it("puts input ref on the native element", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} aria-label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.getAttribute("data-slot")).toBe("input");
  });

  it("spaces the input from the Tailwind scale", () => {
    render(<Input aria-label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("data-slot")).toBe("input");
    expect(input.className).toContain("px-3");
    expect(input.className).not.toContain("px-control-inline");
    expect(input.className).toContain("py-control-block");
    expect(input.className).toContain("h-control-height");
    expect(input.className).toContain("text-control");
    expect(input.className).toContain("rounded-md");
  });

  it("spaces button content from control tokens", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("gap-2");
    expect(button.className).not.toContain("gap-button-gap");
    expect(button.className).toContain("py-2");
    expect(button.className).not.toContain("py-control-block-lg");
  });

  it("spaces the small button from the Tailwind scale", () => {
    render(<Button size="sm">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("px-3");
    expect(button.className).not.toContain("px-button-inline-sm");
  });

  it("spaces the large button from the Tailwind scale", () => {
    render(<Button size="lg">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toContain("px-8");
    expect(button.className).not.toContain("px-button-inline-lg");
  });

  it("merges button styles onto asChild link", () => {
    render(
      <Button asChild variant="outline">
        <a href="/save">Save</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Save" });
    expect(link.className).toContain("border-input");
    expect(link.getAttribute("href")).toBe("/save");
  });

  it("renders a badge with its text", () => {
    render(<Badge variant="outline">live</Badge>);
    const badge = screen.getByText("live");
    expect(badge.tagName).toBe("DIV");
    expect(badge.getAttribute("data-slot")).toBe("badge");
    expect(badge.className).toContain("px-badge-inline");
    expect(badge.className).toContain("rounded-md");
    expect(badge.className).toContain("border");
  });

  it("merges badge styles onto asChild link", () => {
    render(
      <Badge asChild variant="secondary">
        <a href="/docs">docs</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.className).toContain("bg-secondary");
    expect(link.getAttribute("href")).toBe("/docs");
  });

  it("links a label to its input", () => {
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Ada" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("placeholder", "Ada");
  });

  it("dims the label with the kit disabled convention", () => {
    render(
      <>
        <Input id="name" placeholder="Ada" disabled className="peer" />
        <Label htmlFor="name">Name</Label>
      </>,
    );
    const label = screen.getByText("Name");
    expect(label.tagName).toBe("LABEL");
    expect(label.getAttribute("data-slot")).toBe("label");
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("peer-disabled:cursor-not-allowed");
    expect(label.className).toContain("peer-disabled:opacity-50");
  });

  it("renders horizontal and vertical separators", () => {
    const { container } = render(
      <>
        <Separator />
        <Separator orientation="vertical" />
      </>,
    );
    const separators = container.querySelectorAll('[data-orientation]');
    expect(separators).toHaveLength(2);
    expect(separators[0]?.className).toContain("border-t");
    expect(separators[1]?.className).toContain("border-l");
    expect(separators[0]?.className).not.toContain("h-separator-thickness");
    expect(separators[1]?.className).not.toContain("w-separator-thickness");
  });

  it("keeps a separator decorative unless named", () => {
    render(
      <>
        <Separator />
        <Separator decorative={false} aria-label="Section break" />
      </>,
    );
    const [decorative, named] = document.querySelectorAll('[data-slot=separator]');
    expect(decorative?.getAttribute("role")).toBe("none");
    expect(named?.getAttribute("role")).toBe("separator");
    expect(named?.getAttribute("aria-label")).toBe("Section break");
  });

  it("renders a skeleton block that pulses only when motion is safe", () => {
    const { container } = render(<Skeleton className="h-4 w-24" data-testid="sk" />);
    const skeleton = container.querySelector('[data-testid="sk"]');
    expect(skeleton?.className).toContain("motion-safe:animate-pulse");
  });

  it("keeps skeleton styles token-driven with no arbitrary values", () => {
    const { container } = render(<Skeleton data-testid="sk-token" />);
    const skeleton = container.querySelector('[data-testid="sk-token"]');
    const className = skeleton?.className ?? "";
    expect(skeleton?.tagName).toBe("DIV");
    expect(skeleton?.getAttribute("data-slot")).toBe("skeleton");
    expect(skeleton?.getAttribute("role")).toBeNull();
    expect(className).toContain("rounded-md");
    expect(className).toContain("bg-muted");
    expect(className).not.toContain("[");
  });

  it("renders headings at the level tag with size classes", () => {
    render(
      <>
        <Heading level={1}>Title</Heading>
        <Heading level={3}>Section</Heading>
        <Heading level={2} as="div">
          Plain
        </Heading>
      </>,
    );
    expect(screen.getByRole("heading", { name: "Title", level: 1 }).className).toContain("text-4xl");
    expect(screen.getByRole("heading", { name: "Section", level: 3 }).className).toContain("text-2xl");
    expect(screen.getByText("Plain").tagName).toBe("DIV");
  });

  it("renders body and muted text", () => {
    render(
      <>
        <Text>Body copy.</Text>
        <Text variant="muted">Secondary copy.</Text>
      </>,
    );
    expect(screen.getByText("Secondary copy.").className).toContain("text-muted-foreground");
  });

  it("merges heading styles onto asChild link", () => {
    render(
      <Heading level={2} asChild>
        <a href="#section">Section</a>
      </Heading>,
    );
    const link = screen.getByRole("link", { name: "Section" });
    expect(link.className).toContain("text-3xl");
    expect(link.className).toContain("scroll-m-heading-scroll");
    expect(link.getAttribute("href")).toBe("#section");
  });

  it("merges text styles onto asChild child", () => {
    render(
      <Text variant="muted" asChild>
        <span>Secondary copy.</span>
      </Text>,
    );
    const copy = screen.getByText("Secondary copy.");
    expect(copy.tagName).toBe("SPAN");
    expect(copy.className).toContain("text-muted-foreground");
  });

  it("renders default and destructive alerts", () => {
    render(
      <>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something worth knowing.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Failed</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      </>,
    );
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(alerts[0]?.getAttribute("data-slot")).toBe("alert");
    expect(alerts[0]?.className).toContain("rounded-lg");
    expect(alerts[1]?.className).toContain("text-destructive");
  });

  it("spaces the alert from the Tailwind scale", () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("py-3");
    expect(alert.className).not.toContain("py-alert-block");
  });

  it("merges alert styles onto an asChild section", () => {
    render(
      <Alert asChild>
        <section aria-label="Maintenance notice">
          <AlertTitle>Scheduled maintenance</AlertTitle>
        </section>
      </Alert>,
    );
    const section = screen.getByRole("alert", { name: "Maintenance notice" });
    expect(section.tagName).toBe("SECTION");
    expect(section.className).toContain("px-4");
  });

  it("renders a textarea with its placeholder", () => {
    render(<Textarea placeholder="A few words." aria-label="Bio" />);
    expect(screen.getByLabelText("Bio")).toHaveProperty("placeholder", "A few words.");
  });

  it("applies control spacing tokens on input and textarea", () => {
    render(
      <>
        <Input aria-label="Name" />
        <Textarea aria-label="Bio" />
      </>,
    );
    expect(screen.getByLabelText("Name").className).toContain("h-control-height");
    expect(screen.getByLabelText("Bio").className).toContain("min-h-textarea-min-height");
    expect(screen.getByLabelText("Bio").className).toContain("px-3");
    expect(screen.getByLabelText("Bio").className).not.toContain("px-control-inline");
    expect(screen.getByLabelText("Bio").className).toContain("py-2");
    expect(screen.getByLabelText("Bio").className).not.toContain("py-control-block-lg");
  });

  it("sizes every text field from the input font-size token, never a fixed text-* size", () => {
    render(
      <>
        <Input aria-label="Name" />
        <Textarea aria-label="Bio" />
      </>,
    );
    for (const label of ["Name", "Bio"]) {
      const classes = screen.getByLabelText(label).className.split(/\s+/);
      expect(classes).toContain("text-control");
      expect(classes).not.toContain("text-sm");
      expect(classes).not.toContain("text-xs");
      expect(classes).not.toContain("md:text-sm");
    }
  });

  it("renders a card with header, content, and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
          <CardDescription>Connection details.</CardDescription>
        </CardHeader>
        <CardContent>Body text.</CardContent>
        <CardFooter>Footer text.</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Server")).not.toBeNull();
    expect(screen.getByText("Connection details.")).not.toBeNull();
    expect(screen.getByText("Body text.")).not.toBeNull();
    expect(screen.getByText("Footer text.")).not.toBeNull();
  });

  it("spaces card slots from theme tokens", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
        </CardHeader>
        <CardContent>Body text.</CardContent>
        <CardFooter>Footer text.</CardFooter>
      </Card>,
    );
    const title = screen.getByText("Server");
    const root = title.parentElement?.parentElement;
    expect(root?.getAttribute("data-slot")).toBe("card");
    expect(root?.className).toContain("rounded-xl");
    expect(title.parentElement?.className).toContain("p-card-padding");
    expect(title.parentElement?.className).toContain("space-y-card-stack");
    expect(screen.getByText("Body text.").className).toContain("p-card-padding");
    expect(screen.getByText("Footer text.").className).toContain("p-card-padding");
    expect(root?.className).toContain("shadow-md");
    expect(root?.className).not.toMatch(/(^|\s)shadow(\s|$)/);
  });
});
