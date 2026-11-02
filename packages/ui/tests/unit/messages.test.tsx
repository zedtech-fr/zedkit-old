import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  OfflineNote,
  ZedkitUiProvider,
  zedkitUiMessagesFr,
} from "#index.js";
import { Gallery } from "#preview/gallery.js";

import { stubDrawerJsdom } from "./drawer-fixture.js";

beforeAll(() => {
  stubDrawerJsdom();
});

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../../src");
const ATTR_LITERAL = /\b(?:aria-label|placeholder|title)="[^"{]*"/;
const KIT_ENGLISH = [
  '"Close"',
  '"Confirm"',
  '"Cancel"',
  '"Loading"',
  '"Progress"',
  '"Filter…"',
  '"No results."',
  '"Previous"',
  '"Next"',
  '"Copy to clipboard"',
  '"Live"',
  '"Idle"',
  '"Options"',
  '"Identity"',
  '"Scrollable table"',
  `"You're offline."`,
  '"Changes will sync when you reconnect."',
  '"just now"',
  '"Updated"',
  '"Default"',
  '" (default)"',
  '"The page behind this sheet updates as you choose."',
  '"Page {page} of {pageCount}"',
  '"Loading…"',
  '"Loading options"',
  '" (selected)"',
  '"Remove {label}"',
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe("kit chrome messages", () => {
  it("keeps aria-label, title, and placeholder literals out of src hosts", () => {
    const files = walk(SRC).filter((path) => path.endsWith(".tsx") || path.endsWith(".ts"));
    const hits: string[] = [];
    for (const path of files) {
      if (path.endsWith("messages.ts")) continue;
      const source = readFileSync(path, "utf8");
      if (ATTR_LITERAL.test(source)) hits.push(`${path}: attribute literal`);
      for (const needle of KIT_ENGLISH) {
        if (source.includes(needle)) hits.push(`${path}: ${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("lets a prop override the French bundle", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <OfflineNote title="Pas de réseau">Réessayez.</OfflineNote>
      </ZedkitUiProvider>,
    );
    expect(screen.getByText("Pas de réseau")).not.toBeNull();
    expect(screen.getByText("Réessayez.")).not.toBeNull();
    expect(screen.queryByText("Vous êtes hors ligne.")).toBeNull();
  });

  it("renders kit chrome in French inside the gallery", async () => {
    const user = userEvent.setup();
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <Gallery />
      </ZedkitUiProvider>,
    );

    expect(screen.getAllByLabelText("Filtrer…").length).toBeGreaterThan(0);
    expect(screen.getByText("Aucun résultat.")).not.toBeNull();
    expect(screen.getByText("Précédent")).not.toBeNull();
    expect(screen.getByText("Suivant")).not.toBeNull();
    expect(screen.getByText("Page 1 sur 2")).not.toBeNull();
    expect(screen.getAllByText("En direct").length).toBeGreaterThan(0);
    expect(screen.getByText("Inactif")).not.toBeNull();
    expect(screen.getByText("Vous êtes hors ligne.")).not.toBeNull();
    expect(screen.getByText("Les changements se synchroniseront à la reconnexion.")).not.toBeNull();
    expect(screen.getByText("Mis à jour il y a 3 minutes")).not.toBeNull();
    expect(screen.getAllByLabelText("Progression").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Choix")).not.toBeNull();
    expect(screen.getByLabelText("Copier dans le presse-papiers")).not.toBeNull();
    expect(screen.queryByLabelText("Filter…")).toBeNull();
    expect(screen.queryByText("No results.")).toBeNull();
    expect(screen.queryByText("You're offline.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("button", { name: "Fermer" })).not.toBeNull();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Confirmer" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Annuler" })).not.toBeNull();
  });

  it("keeps English when no provider wraps the tree", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Hi</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: "Close" })).not.toBeNull();
  });
});
