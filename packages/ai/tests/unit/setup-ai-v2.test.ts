import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { readManifest } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { kitDir } from "#kit.js";
import { tempDir } from "./helpers.js";

const KIT_TEMPLATE_PATHS = [
  "skills/setup-ai/templates/README.md",
  "skills/setup-ai/templates/product.template.md",
  "skills/setup-ai/templates/domain/booking.template.md",
  "skills/setup-ai/templates/personas-v2.template.md",
  "skills/setup-ai/templates/design.template.md",
  "skills/setup-ai/templates/glossary.template.md",
  "skills/setup-ai/templates/catalog/add-capability/SKILL.md.tmpl",
  "skills/setup-ai/templates/catalog/add-migration/SKILL.md.tmpl",
  "skills/setup-ai/templates/catalog/domain-change/SKILL.md.tmpl",
];

function install(
  dest: string,
  options: Omit<Parameters<typeof installKit>[0], "dest"> = {},
) {
  const result = installKit({ dest, providers: ["cursor"], ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

describe("setup-ai v2 kit", () => {
  it("ships artifact and catalog templates under setup-ai/templates in the kit", () => {
    const kit = kitDir();
    for (const rel of KIT_TEMPLATE_PATHS) {
      const path = join(kit, rel);
      expect(existsSync(path), `missing ${rel}`).toBe(true);
      expect(readFileSync(path, "utf8").length, rel).toBeGreaterThan(40);
    }
  });

  it("documents phased audit, discovery, build, and catalog skills", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toMatch(/Phase A — Audit/u);
    expect(raw).toMatch(/Phase B — Discovery/u);
    expect(raw).toMatch(/Phase C — Build/u);
    expect(raw).toMatch(/Phase D — Catalog/u);
    expect(raw).toContain("templates/README.md");
    expect(raw).toContain("npx zedkit-ai setup");
    expect(raw).toMatch(/never .+ by hand/iu);
  });

  it("limits the batched interview to at most eight questions", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toMatch(/at most eight questions/iu);
    expect(raw).toMatch(/8\. Explicit \*\*non-goals\*\*/u);
    const block = raw.slice(
      raw.indexOf("Suggested set"),
      raw.indexOf("3. Record answers"),
    );
    const questions = [...block.matchAll(/^\s{3}\d+\.\s/gm)];
    expect(questions.length).toBe(8);
  });

  it("documents tagging owner answers with source: owner", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toContain("source: owner");
    expect(raw).toMatch(/\*\*`source: owner`\*\*/u);
  });

  it("documents scorer gaps G1–G4 in setup-ai SKILL.md", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toMatch(
      /approved plan|nothing may change outside this table/iu,
    );
    expect(raw).toContain("package.json");
    expect(raw).toMatch(/pnpm-lock|lockfile/iu);
    expect(raw).toMatch(/gate outcomes/iu);
    expect(raw).toMatch(/Re-open every `file:line`/u);
    expect(raw).toContain("no test — flag");
    expect(raw).toMatch(/cut short/iu);
    expect(raw).toMatch(/main gate last/iu);
    const log = readFileSync(
      join(
        kitDir(),
        "skills",
        "setup-ai",
        "templates",
        "setup-log.template.md",
      ),
      "utf8",
    );
    expect(log).toContain("Gate outcomes");
    const rubric = readFileSync(
      join(kitDir(), "skills", "setup-ai", "templates", "setup-rubric.md"),
      "utf8",
    );
    expect(rubric).toMatch(/CMD:/u);
    expect(rubric).toContain("Gate outcomes");
  });

  it("documents run-3 scorer fixes S1–S5 in setup-ai SKILL and templates", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toMatch(/first output after `\/setup-ai` starts/iu);
    expect(raw).toMatch(/headless/iu);
    expect(raw).toMatch(/Always record.*every setup-log entry/iu);
    expect(raw).toMatch(/selection question.*conditional/iu);
    expect(raw).toContain("CMD:");
    expect(raw).toMatch(/last line of the file/iu);
    expect(raw).toMatch(/OOM-safe fallback/iu);
    expect(raw).toMatch(/--concurrency=2/);
    expect(raw).toMatch(/Sidecar cleanup/iu);
    expect(raw).toMatch(/Phase C close — stale adopt sidecars/iu);
    expect(raw).toMatch(/Phase E checklist/iu);
    expect(raw).toMatch(/one.*kit-issue draft per friction/iu);
    const log = readFileSync(
      join(
        kitDir(),
        "skills",
        "setup-ai",
        "templates",
        "setup-log.template.md",
      ),
      "utf8",
    );
    expect(log).toContain("Providers (always paste");
    expect(log).toMatch(/CMD:/);
    expect(log).toMatch(/Sidecar cleanup/);
    const issue = readFileSync(
      join(
        kitDir(),
        "skills",
        "setup-ai",
        "templates",
        "kit-issue.template.md",
      ),
      "utf8",
    );
    expect(issue).toContain("Kit root cause");
  });

  it("documents run-4 scorer fixes R1–R5 in setup-ai SKILL and templates", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toContain("git status --porcelain");
    expect(raw).toContain("git diff --name-only");
    expect(raw).toMatch(/Plan reconciliation/iu);
    expect(raw).toMatch(/Do not append validate, prettier/iu);
    expect(raw).toMatch(/Journey tests/iu);
    expect(raw).toMatch(/Unenforced rules/iu);
    expect(raw).toMatch(/Status.*current.*target/iu);
    expect(raw).toMatch(/open the test file/iu);
    expect(raw).toMatch(/Deferred high-risk skills/iu);
    expect(raw).toMatch(/Completion defects count/iu);
    const personas = readFileSync(
      join(
        kitDir(),
        "skills",
        "setup-ai",
        "templates",
        "personas-v2.template.md",
      ),
      "utf8",
    );
    expect(personas).toContain("Journey tests");
    const design = readFileSync(
      join(kitDir(), "skills", "setup-ai", "templates", "design.template.md"),
      "utf8",
    );
    expect(design).toMatch(/Do \/ don't by language/iu);
    const domain = readFileSync(
      join(
        kitDir(),
        "skills",
        "setup-ai",
        "templates",
        "domain",
        "booking.template.md",
      ),
      "utf8",
    );
    expect(domain).toContain("| Status");
    const rubric = readFileSync(
      join(kitDir(), "skills", "setup-ai", "templates", "setup-rubric.md"),
      "utf8",
    );
    expect(rubric).toMatch(/git diff --name-only.*against plan/iu);
    expect(rubric).toMatch(/after `\/setup-ai` loads/iu);
  });

  it("gate log snippet uses redirect not tee pipeline (subshell-safe exit code)", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    const gateBlock = raw.slice(
      raw.indexOf("Gate execution log"),
      raw.indexOf("OOM-safe fallback"),
    );
    expect(gateBlock).not.toMatch(/\|\s*tee\s/);
    expect(gateBlock).toContain("sed 's/^EXIT://'");
    expect(gateBlock).toContain('} > "$LOG" 2>&1');
    expect(gateBlock).toMatch(/tail -n 20 "\$LOG"/u);
    const log = readFileSync(
      join(
        kitDir(),
        "skills",
        "setup-ai",
        "templates",
        "setup-log.template.md",
      ),
      "utf8",
    );
    expect(log).not.toMatch(/\|\s*tee\s/);
    expect(log).toContain("sed 's/^EXIT://'");
  });

  it("setup-ai SKILL and templates only name setup-preset slash commands or wrap others in conditionals", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const commandIds = manifest.value.commands ?? [];
    const setupPresetCommands = new Set(
      manifest.value.presetCommands?.setup ?? [],
    );
    expect(setupPresetCommands.has("setup-ai")).toBe(true);
    const paths = listSetupAiMarkdownRelPaths();
    for (const rel of paths) {
      const text = readFileSync(join(kitDir(), rel), "utf8");
      for (const { cmd, index } of kitSlashCommandMentions(text, commandIds)) {
        const allowed =
          setupPresetCommands.has(cmd) || insideConditionalBlock(text, index);
        expect(allowed, `${rel}: /${cmd} at ${index}`).toBe(true);
      }
    }
    const skill = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(skill).not.toMatch(/\/orchestrate/u);
    expect(skill).toMatch(/if:skill=orchestrate/u);
    expect(skill).toContain("edit (dependency added by setup)");
  });

  it("installed setup-ai SKILL follow-up line has no kit-authoring notes on any preset", () => {
    for (const preset of ["starter", "setup", "core", "full"] as const) {
      const root = tempDir();
      install(root, { preset });
      const skill = readFileSync(
        join(root, ".agents", "skills", "setup-ai", "SKILL.md"),
        "utf8",
      );
      expect(skill, preset).toMatch(/give your agent the goal in one line/u);
      expect(skill, preset).not.toMatch(
        /presetCommands|When that skill is not installed|Slash commands|line\.When/u,
      );
    }
  });

  it("installs templates beside setup-ai for every preset that ships setup-ai; validate stays clean", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    for (const preset of ["starter", "setup", "core", "full"] as const) {
      const root = tempDir();
      install(root, { preset });
      const agents = join(root, ".agents");
      expect(validateKit(agents), preset).toEqual([]);
      const templates = join(agents, "skills", "setup-ai", "templates");
      expect(existsSync(templates), preset).toBe(true);
      expect(existsSync(join(templates, "README.md")), preset).toBe(true);
      expect(
        existsSync(
          join(templates, "catalog", "domain-change", "SKILL.md.tmpl"),
        ),
        preset,
      ).toBe(true);
    }
  });

  it("init --adopt twice is a no-op and validate stays clean (setup preset)", () => {
    const root = tempDir();
    install(root, { preset: "setup", adopt: true });
    const again = install(root, { preset: "setup", adopt: true });
    expect(
      again.filter(
        (a) => a.kind === "copy" || a.kind === "link" || a.kind === "write",
      ),
    ).toEqual([]);
    expect(validateKit(join(root, ".agents"))).toEqual([]);
    expect(checkDrift(root, join(root, ".agents"))).toEqual([]);
  });

  it("every templates/ path referenced in setup-ai SKILL.md exists in the kit tree", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    const refs = templateRefs(raw);
    expect(refs.length).toBeGreaterThan(3);
    for (const rel of refs) {
      expect(existsSync(join(kitDir(), "skills", "setup-ai", rel)), rel).toBe(
        true,
      );
    }
  });

  it("every templates/ path referenced in setup-ai SKILL.md exists after install", () => {
    const root = tempDir();
    install(root, { preset: "setup" });
    const raw = readFileSync(
      join(root, ".agents", "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    for (const rel of templateRefs(raw)) {
      expect(
        existsSync(join(root, ".agents", "skills", "setup-ai", rel)),
        rel,
      ).toBe(true);
    }
  });
});

function listSetupAiMarkdownRelPaths(): string[] {
  const root = join(kitDir(), "skills", "setup-ai");
  const out: string[] = ["skills/setup-ai/SKILL.md"];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const rel = `${prefix}/${name.name}`;
      if (name.isDirectory()) walk(join(dir, name.name), rel);
      else if (name.name.endsWith(".md") || name.name.endsWith(".tmpl")) {
        out.push(`skills/setup-ai/${rel}`);
      }
    }
  };
  walk(join(root, "templates"), "templates");
  return out;
}

function insideConditionalBlock(text: string, index: number): boolean {
  const head = text.slice(0, index);
  const markerRe = /<!--[ \t]*(if:(.*?)|\/if)[ \t]*-->/gu;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(head)) !== null) {
    if (m[1] === "/if") depth = Math.max(0, depth - 1);
    else depth += 1;
  }
  return depth > 0;
}

function kitSlashCommandMentions(
  text: string,
  commandIds: readonly string[],
): { cmd: string; index: number }[] {
  const cmdSet = new Set(commandIds);
  const out: { cmd: string; index: number }[] = [];
  const re = /(^|[^\w:/])\/([a-z][a-z0-9-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const cmd = m[2];
    const prefix = m[1];
    if (cmd && prefix !== undefined && cmdSet.has(cmd)) {
      out.push({ cmd, index: m.index + prefix.length });
    }
  }
  return out;
}

function templateRefs(markdown: string): string[] {
  return [
    ...new Set(
      [...markdown.matchAll(/`templates\/[^`<]+`/gu)]
        .map((m) => m[0]?.slice(1, -1) ?? "")
        .filter((p) => p.length > 0),
    ),
  ];
}
