import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { checkDepth } from "#setup-depth.js";
import { put, tempDir, TOKENOMICS_D4 } from "./helpers.js";

/** A fictional brand: cream page, mauve surface, one saturated pine accent; serif display, sans body, mono data. */
const TOKENS = [
  ":root {",
  "  --color-cream: hsl(40 45% 96%);",
  "  --color-mauve-100: hsl(300 18% 90%);",
  "  --color-pine-600: hsl(160 55% 28%);",
  "  --font-display: 'Fraunces', Georgia, serif;",
  "}",
  "body { font-family: 'Work Sans', system-ui, sans-serif; }",
  "code { font-family: 'JetBrains Mono', ui-monospace; }",
  "",
].join("\n");

const IDENTITY =
  "## Identity rules\n\n| I-01 | current | One accent for the primary action | `src/styles/tokens.css:4` |\n";

const SIGNATURE = [
  "## Signature (visual invariants)",
  "",
  "| Role | Token | Value | Source |",
  "| page | `--color-cream` | `hsl(40 45% 96%)` | `src/styles/tokens.css:2` |",
  "",
  "**Font families by role**",
  "",
  "| display | Fraunces | Georgia, serif | `src/styles/tokens.css:5` |",
  "",
  "**Accent:** `--color-pine-600` is the primary call to action only (`src/ui/Button.tsx:21`).",
  "",
].join("\n");

function repo(design: string, css = TOKENS): string {
  const root = tempDir();
  put(root, "src/styles/tokens.css", css);
  put(root, "src/ui/Button.tsx", "export const x = 1;\n");
  put(
    root,
    "src/AGENTS.md",
    "# src\n\nDesign: ../.agents/design.md and ../.agents/domain/ui.md\n",
  );
  put(
    root,
    "AGENTS.md",
    "# Root\n\n## Tokenomics\n\nSee `.agents/tokenomics.md`.\n",
  );
  put(
    root,
    ".agents/setup-log/reading.md",
    "**Budget:** none found\n| 1 | `src` | scout | 3 |\n\n`src/ui/Button.tsx:21`\n\n## Meaning check\n\n| ID | Verdict | Code does | Resolution |\n",
  );
  put(
    root,
    ".agents/domain/ui.md",
    "| U-01 | current | One accent | `src/ui/Button.tsx:21` |\n",
  );
  put(
    root,
    ".agents/tokenomics.md",
    TOKENOMICS_D4,
  );
  put(root, ".agents/design.md", design);
  return root;
}

const messages = (root: string): string[] =>
  checkDepth(root).map((issue) => issue.message);

describe("visual signature (D2)", () => {
  it("a repo whose CSS defines colours and fonts needs a Signature section in design.md", () => {
    expect(messages(repo(IDENTITY))).toEqual([
      expect.stringContaining("no `## Signature`"),
    ]);
  });

  it("passes with colour roles, font families, an Accent line and file:line evidence", () => {
    expect(messages(repo(`${IDENTITY}\n${SIGNATURE}`))).toEqual([]);
  });

  it("each missing piece fails: evidence, fonts, the single accent role", () => {
    const body = (drop: RegExp) =>
      `${IDENTITY}\n${SIGNATURE.replace(drop, "")}`;
    expect(messages(repo(body(/:\d+/gu)))).toHaveLength(1);
    expect(messages(repo(body(/\*\*Font families[^\n]*\n/u)))).toHaveLength(1);
    expect(messages(repo(body(/\*\*Accent:\*\*[^\n]*\n/u)))).toHaveLength(1);
  });

  it("a stylesheet with no colour variables or no fonts does not ask for one", () => {
    expect(messages(repo(IDENTITY, "a { color: red; }\n"))).toEqual([]);
    expect(
      messages(repo(IDENTITY, ":root { --color-cream: #fff8ee; }\n")),
    ).toEqual([]);
  });
});

describe("the setup-ai kit teaches the signature", () => {
  const read = (rel: string): string =>
    readFileSync(join(kitDir(), rel), "utf8").replace(/\s+/gu, " ");

  it("the design template carries colour roles, fonts by role, one accent and exact alias exceptions", () => {
    const template = read("skills/setup-ai/templates/design.template.md");
    for (const part of [
      "## Signature (visual invariants)",
      "**Colour roles**",
      "**Font families by role**",
      "**Accent:**",
      "**Alias exceptions**",
    ]) {
      expect(template).toContain(part);
    }
  });

  it("readers extract it, the skill keeps it in improve mode, the rubric scores it", () => {
    expect(
      read("skills/setup-ai/templates/reader-brief.template.md"),
    ).toContain("Visual signature");
    const skill = read("skills/setup-ai/SKILL.md");
    expect(skill).toContain("Improve mode keeps those rows as written");
    expect(read("skills/setup-ai/templates/setup-rubric.md")).toContain(
      "**Signature** section",
    );
  });
});
