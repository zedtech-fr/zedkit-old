import { describe, expect, it } from "vitest";
import {
  installNextStepLines,
  kitPathsMissingFromPrettierIgnore,
  repoUsesPrettier,
} from "#install-next-step.js";
import { put, tempDir } from "./helpers.js";

describe("install next step hints", () => {
  it("treats malformed package.json as non-prettier for deps but still detects config files", () => {
    const root = tempDir();
    put(root, "package.json", "{ not valid json\n");
    expect(repoUsesPrettier(root)).toBe(false);
    put(root, ".prettierrc", "{}\n");
    expect(repoUsesPrettier(root)).toBe(true);
  });

  it("includes phase C checklist and no prettier lines when Prettier is not used", () => {
    const root = tempDir();
    const lines = installNextStepLines(root, ["cursor"]);
    expect(lines[0]).toContain("/setup-ai");
    expect(lines.some((line) => line.includes("product.md"))).toBe(true);
    expect(lines.some((line) => line.startsWith("prettier:"))).toBe(false);
  });

  it("points past phase C instead of repeating it when product.md already exists", () => {
    const root = tempDir();
    put(root, ".agents/product.md", "# Product\n");
    const lines = installNextStepLines(root, ["cursor"]);
    expect(lines).toContain("next: validate, then phase E score");
    expect(lines.some((line) => line.includes("phase C adds"))).toBe(false);
    expect(lines.some((line) => line.includes("/setup-ai"))).toBe(false);
  });

  it("prints exact .prettierignore lines when Prettier is configured and paths are missing", () => {
    const root = tempDir();
    put(root, "package.json", JSON.stringify({ devDependencies: { prettier: "3.0.0" } }));
    put(root, ".prettierrc", "{}\n");
    const lines = installNextStepLines(root, ["cursor"]);
    expect(lines).toContain("prettier: add to .prettierignore:");
    expect(lines).toContain(".agents/");
    expect(lines).toContain(".cursor/skills/");
    expect(lines).toContain(".cursor/agents/");
    expect(lines).toContain(".cursor/commands/");
    expect(kitPathsMissingFromPrettierIgnore(root, ["cursor"]).length).toBeGreaterThan(0);
    expect(repoUsesPrettier(root)).toBe(true);
  });

  it("prints nothing extra for prettier when ignore file already covers kit paths", () => {
    const root = tempDir();
    put(root, "package.json", JSON.stringify({ devDependencies: { prettier: "3.0.0" } }));
    put(
      root,
      ".prettierignore",
      [".agents/", ".cursor/skills/", ".cursor/agents/", ".cursor/commands/"].join("\n"),
    );
    const lines = installNextStepLines(root, ["cursor"]);
    expect(lines.some((line) => line.startsWith("prettier:"))).toBe(false);
  });

  it("includes .claude/ in prettier hints when claude is wired", () => {
    const root = tempDir();
    put(root, "package.json", JSON.stringify({ scripts: { format: "prettier --check ." } }));
    const missing = kitPathsMissingFromPrettierIgnore(root, ["claude"]);
    expect(missing).toContain(".claude/");
  });

  it("suggests pnpm install for a pnpm workspace without node_modules", () => {
    const root = tempDir();
    put(root, "pnpm-workspace.yaml", "packages:\n  - apps/*\n");
    expect(installNextStepLines(root, ["cursor"])).toContain("next: pnpm install (workspace deps missing)");
    put(root, "node_modules/.keep", "x\n");
    expect(installNextStepLines(root, ["cursor"])).not.toContain("next: pnpm install (workspace deps missing)");
    const plain = tempDir();
    expect(installNextStepLines(plain, ["cursor"])).not.toContain("next: pnpm install (workspace deps missing)");
  });
});
