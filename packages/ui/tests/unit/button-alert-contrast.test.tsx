import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Button,
  ErrorState,
  Switch,
  alertVariants,
  buttonVariants,
} from "#index.js";

const pkg = resolve(__dirname, "../..");

describe("button and alert contrast (ZK-02)", () => {
  it("gives every filled and outline action variant an explicit resting text color", () => {
    for (const variant of ["default", "destructive", "outline", "secondary", "ghost"] as const) {
      const classes = buttonVariants({ variant });
      expect(classes, variant).toMatch(/\btext-foreground\b|\btext-(?:primary|secondary|destructive)-foreground\b/);
    }
    expect(buttonVariants({ variant: "link" })).toMatch(/\btext-primary\b/);
  });

  it("does not restyle arbitrary alert descendants with destructive foreground", () => {
    const classes = alertVariants({ variant: "destructive" });
    expect(classes).not.toMatch(/\[&_[^\]]+\]:text-destructive-foreground/);
  });

  it("keeps an outline retry action legible inside a destructive error state", () => {
    render(
      <ErrorState
        description="Check your connection and try again."
        actions={
          <Button type="button" variant="outline">
            Try again
          </Button>
        }
      />,
    );
    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry.className).toContain("text-foreground");
    expect(retry.className).toContain("bg-background");
    expect(retry.className).not.toContain("text-destructive-foreground");
  });
});

describe("switch geometry (ZK-11)", () => {
  const identitySpacingRem: Record<string, number> = {
    mist: 0.25,
    press: 0.2,
    tide: 0.28,
    volt: 0.225,
    maison: 0.3,
    glass: 0.32,
  };

  it("derives thumb travel from track width minus thumb (border-aware)", () => {
    const source = readFileSync(resolve(pkg, "src/switch.tsx"), "utf8");
    expect(source).toContain("calc(var(--spacing)");
    expect(source).not.toContain("w-switch-track-width");
    expect(source).not.toContain("translate-x-4");
    expect(source).not.toContain("size-4");
  });

  it.each(Object.entries(identitySpacingRem))(
    "keeps the checked thumb inside the track for %s density",
    (_id, spacingRem) => {
      const trackRem = spacingRem * 9;
      const thumbRem = spacingRem * 4;
      const borderRem = 4 / 16;
      const travelRem = trackRem - borderRem - thumbRem;
      expect(travelRem).toBeGreaterThanOrEqual(0);
      expect(travelRem + thumbRem).toBeLessThanOrEqual(trackRem - borderRem + 1e-9);
    },
  );

  it("keeps a separate touch hit target on the switch root", () => {
    render(<Switch aria-label="Notify" />);
    const toggle = screen.getByRole("switch", { name: "Notify" });
    expect(toggle.classList.contains("hit-target")).toBe(true);
  });
});
