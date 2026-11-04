import { describe, expect, it } from "vitest";
import {
  installNextStepLines,
  kitPathsMissingFromPrettierIgnore,
  repoUsesPrettier,
} from "#install-next-step.js";
import { put, tempDir } from "./helpers.js";

describe("install next step hints", () => {
  it("includes phase C checklist and no prettier lines when Prettier is not used", () => {
    const root = tempDir();
    const lines = installNextStepLines(root, ["cursor"]);
    expect(lines[0]).toContain("/setup-ai");
    expect(lines.some((line) => line.includes("product.md"))).toBe(true);
    expect(lines.some((line) => line.startsWith("prettier:"))).toBe(false);
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
});
