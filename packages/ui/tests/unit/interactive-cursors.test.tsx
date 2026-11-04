import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "#index.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#index.js";
import { Input } from "#index.js";
import { Switch } from "#index.js";
import { Tabs, TabsList, TabsTrigger } from "#index.js";

const stylesPath = join(dirname(fileURLToPath(import.meta.url)), "../../src/styles.css");

describe("interactive cursors", () => {
  it("documents pointer, text, and not-allowed rules in the base layer", () => {
    const css = readFileSync(stylesPath, "utf8");
    expect(css).toContain("cursor: pointer");
    expect(css).toContain("cursor: text");
    expect(css).toContain("cursor: not-allowed");
    expect(css).toMatch(/button:not\(:disabled\)/);
    expect(css).toMatch(/\[aria-disabled="true"\]/);
  });

  it("marks primary controls with pointer or text in component classes", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" }).className).toContain("disabled:cursor-not-allowed");

    render(<Input aria-label="Name" />);
    expect(screen.getByRole("textbox", { name: "Name" }).className).toContain("cursor-text");

    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">One</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "One" }).className).toContain("cursor-pointer");

    render(<Switch aria-label="Notify" />);
    expect(screen.getByRole("switch", { name: "Notify" }).className).toContain("cursor-pointer");
  });

  it("marks menu items as pointer with disabled not-allowed", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole("menuitem", { name: "Duplicate" }).className).toContain("cursor-pointer");
    expect(screen.getByRole("menuitem", { name: "Duplicate" }).className).toContain(
      "data-[disabled]:cursor-not-allowed",
    );
  });
});
