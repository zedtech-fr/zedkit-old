import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const docsAppRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Canonical UI quickstart copy-paste files (docs home + getting-started + CI smoke). */
export const UI_QUICKSTART_SNIPPETS_DIR = join(docsAppRoot, "home-quickstart", "snippets");

export const UI_QUICKSTART_SNIPPET_NAMES = [
  "install.sh",
  "npm-globals.css",
  "npm-page.tsx",
  "registry-theme-add.sh",
  "registry-add.sh",
  "registry-page.tsx",
  "registry-namespace.sh",
  "ai-init.sh",
];
