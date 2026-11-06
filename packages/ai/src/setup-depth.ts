// Original work by the same author.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { listRepoFiles, minReaders, scanRepo } from "./scan.js";
import { parseTokenomics, POLICY_PROVIDERS } from "./tokenomics.js";
import type { Issue } from "./validate.js";

// A cited line: path/to/file.ext:42
const EVIDENCE = /[\w./@-]+\.[A-Za-z0-9]+:\d+/u;

function text(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const raw = tryCatch(() => readFileSync(path, "utf8"));
  return raw.ok ? raw.value : undefined;
}

// Rules whose meaning hangs on order, atomicity or timing: a citation alone cannot show them.
const SEQUENCING = /\b(after|before|same transaction|one transaction|atomic\w*|commits?|retr(?:y|ies)|idempoten\w+|exactly once|at most once|within \d+|only when)\b/iu;
const RULE_ID = /^R\d+-\d+$/u;

/** First-column IDs and cells of the table rows in `text`. */
function ruleRows(text: string): string[][] {
  return text
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((c) => RULE_ID.test(c[0] ?? ""));
}

/** D1: every sequencing rule was checked against the code it cites, and no contradiction is left open. */
function meaning(body: string, path: string, issues: Issue[]): void {
  const at = body.search(/^##+ Meaning check\b/mu);
  if (at < 0) {
    issues.push({ path, message: "D1 code reading: no `## Meaning check` (a second reader checks each rule says what its cited code does)" });
    return;
  }
  const check = body.slice(at).split("\n").slice(1).join("\n").split(/^## /mu)[0] ?? "";
  const rows = ruleRows(check);
  for (const [id, verdict = "", , resolution = ""] of rows) {
    if (/^(partial|mismatch)$/iu.test(verdict) && !/^(rewritten|dropped|conflict)/iu.test(resolution)) {
      issues.push({ path, message: `D1 code reading: ${id} is ${verdict} with no resolution (rewritten, dropped or conflict)` });
    }
  }
  const known = new Set(rows.map((c) => c[0]));
  const missing = ruleRows(body.replace(check, "")).filter((c) => !known.has(c[0]) && SEQUENCING.test(c[3] ?? "")).map((c) => c[0]);
  if (missing.length > 0) issues.push({ path, message: `D1 code reading: ${missing.join(", ")} have no row in the Meaning check (order, atomicity and timing rules are checked, not sampled)` });
}

/** D1: the code was read first, by readers scaled to repo size, with file evidence. */
function reading(root: string, issues: Issue[]): void {
  const path = join(root, ".agents/setup-log/reading.md");
  const body = text(path);
  if (body === undefined) {
    issues.push({ path, message: "D1 code reading: no reading log (spawn read-only readers per `zedkit-ai scan`, then write .agents/setup-log/reading.md)" });
    return;
  }
  const { size, slices } = scanRepo(root);
  const rows = body.split("\n").filter((line) => /^\|\s*\d+\s*\|/u.test(line));
  const need = minReaders(size, slices.length);
  if (rows.length < need) {
    issues.push({ path, message: `D1 code reading: ${rows.length} reader row(s), a ${size} repo needs at least ${need} (see \`zedkit-ai scan\`)` });
  }
  if (!EVIDENCE.test(body)) issues.push({ path, message: "D1 code reading: no file:line evidence in the reading log" });
  if (!/^\*\*Budget:\*\*/mu.test(body))
    issues.push({ path, message: "D1 code reading: no **Budget:** line (state the run budget or `none found`; an overrun needs an owner-approved exception)" });
  meaning(body, path, issues);
}

const UI_FILE = /\.(tsx|jsx|vue|svelte|css|scss)$/u;

/** A `## <name>` section of design.md: heading to the next `## `. */
function sectionOf(design: string, name: string): string | undefined {
  const at = design.search(new RegExp(`^#{2,3} ${name}\\b`, "mu"));
  if (at < 0) return undefined;
  const rest = design.slice(at).split("\n").slice(1).join("\n");
  return rest.split(/^## /mu)[0];
}

const STYLE_FILE = /\.s?css$/u;

/** True when a stylesheet defines colour variables and font families: the repo has a visual signature to keep. */
function hasSignature(root: string): boolean {
  const css = listRepoFiles(root).filter((p) => STYLE_FILE.test(p)).slice(0, 300).map((p) => text(join(root, p)) ?? "").join("\n");
  return /font-family\s*:/u.test(css) && /--[\w-]+\s*:\s*(#|hsl|oklch|rgb)/iu.test(css);
}

/** D2: domain rules (each citing code or the owner), and identity rules when the repo has a UI. */
function rules(root: string, issues: Issue[]): void {
  const dir = join(root, ".agents/domain");
  const listed = tryCatch(() => readdirSync(dir));
  const files = listed.ok ? listed.value.filter((f) => f.endsWith(".md") && !f.endsWith(".kit.md") && !f.endsWith(".template.md")) : [];
  if (files.length === 0) {
    issues.push({ path: dir, message: "D2 domain rules: no .agents/domain/*.md (business and invariant rules extracted from the code)" });
  }
  let rows = text(join(root, ".agents/design.md")) ?? "";
  for (const file of files) {
    const body = text(join(dir, file)) ?? "";
    if (!EVIDENCE.test(body) && !body.includes("source: owner")) {
      issues.push({ path: join(dir, file), message: "D2 domain rules: no file:line or `source: owner` evidence" });
    }
    rows += `\n${body}`;
  }
  const inventory = `${text(join(root, "AGENTS.md")) ?? ""}\n${text(join(root, ".agents/setup-log.md")) ?? ""}`;
  for (const [, id = ""] of rows.matchAll(/^\|\s*(\w+-\d+)\s*\|\s*current\b.*documented, not enforced/gimu)) {
    if (!inventory.includes(id)) issues.push({ path: dir, message: `D2 domain rules: inventory misses ${id} (current, documented, not enforced)` });
  }
  for (const file of listRepoFiles(root).filter((p) => p.includes("/") && p.endsWith("/AGENTS.md"))) {
    if (text(join(root, file))?.includes("documented, not enforced") && !inventory.includes(file)) {
      issues.push({ path: join(root, file), message: `D2 nested rules: inventory misses ${file} (documented, not enforced)` });
    }
  }
  if (!listRepoFiles(root).some((p) => UI_FILE.test(p))) return;
  const path = join(root, ".agents/design.md");
  const design = text(path) ?? "";
  const identity = sectionOf(design, "Identity rules");
  if (identity === undefined) {
    issues.push({ path, message: "D2 identity rules: the repo has a UI but .agents/design.md has no `## Identity rules` section (brand, voice and naming rules read from the code)" });
  } else if (!EVIDENCE.test(identity) && !identity.includes("source: owner")) {
    issues.push({ path, message: "D2 identity rules: no file:line or `source: owner` evidence in the Identity rules section" });
  }
  if (!hasSignature(root)) return;
  const sig = sectionOf(design, "Signature") ?? "";
  if (!EVIDENCE.test(sig) || !/\bfont/iu.test(sig) || !/^\W*accent\W*:/imu.test(sig)) {
    issues.push({ path, message: "D2 identity rules: stylesheets define colours and fonts but design.md has no `## Signature` with colour roles and font families (file:line) and an `Accent:` line" });
  }
}

/** D3: nested AGENTS.md wired to the setup's rules (links `.agents/`), or a stated `nested-agents:` decision in the setup-log. */
function nested(root: string, issues: Issue[]): void {
  const files = listRepoFiles(root).filter((p) => p.includes("/") && p.endsWith("/AGENTS.md"));
  if (files.some((f) => /\.agents\/(domain|design|product|model-routing|tokenomics)/u.test(text(join(root, f)) ?? ""))) return;
  const log = text(join(root, ".agents/setup-log.md")) ?? "";
  if (/^\s*[-*]?\s*nested-agents:\s*\S/imu.test(log)) return;
  const message =
    files.length === 0
      ? "D3 nested rules: no nested AGENTS.md (add one per folder that differs, or record `nested-agents: none — <reason>` in .agents/setup-log.md)"
      : "D3 nested rules: no nested AGENTS.md links the setup's rules (.agents/domain, .agents/design); extend the existing files, or record `nested-agents: kept — <reason>` in .agents/setup-log.md";
  issues.push({ path: root, message });
}

const PROVIDER_RULE = /(^|\/)(\.cursor\/rules\/[^/]+\.mdc|\.claude\/rules\/[^/]+\.md)$/u;

/**
 * D3: provider-scoped rule files the repo already owns (Cursor `.mdc`, Claude rules) are
 * invisible to the other providers. The reading log's rule map must account for each one.
 */
function ruleMap(root: string, issues: Issue[]): void {
  const path = join(root, ".agents/setup-log/reading.md");
  const log = text(path);
  if (log === undefined) return;
  const missing = listRepoFiles(root, true).filter((f) => PROVIDER_RULE.test(f) && !f.endsWith("/project.mdc") && !log.includes(f));
  if (missing.length === 0) return;
  const shown = missing.slice(0, 3).join(", ");
  const more = missing.length > 3 ? ` and ${missing.length - 3} more` : "";
  issues.push({ path, message: `D3 nested rules: the reading log's Rule map misses ${missing.length} provider rule file(s): ${shown}${more} (each is mirrored by a nested AGENTS.md pointer, kept as the owner, or marked not a rule)` });
}

const asObj = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

function cellModel(data: Record<string, unknown>, provider: string, kind: string, stakes: string): unknown {
  return asObj(asObj(asObj(asObj(data.providers)[provider])[kind])[stakes]).model;
}

const isRealModel = (value: unknown): boolean => typeof value === "string" && value !== "" && value !== "inherit";

/** True when any provider has a real (not `inherit`) model on the two D4 cells. */
function hasFilledCells(data: Record<string, unknown>): boolean {
  return POLICY_PROVIDERS.some(
    (provider) =>
      isRealModel(cellModel(data, provider, "build", "standard")) && isRealModel(cellModel(data, provider, "decide", "sensitive")),
  );
}

const LEGACY_NOTE =
  "warning: D4 tokenomics: .agents/model-routing.md is deprecated; copy its rows into .agents/tokenomics.md, delete it, and point AGENTS.md at the new file. Removed two minors after this release.";

/**
 * D4: `.agents/tokenomics.md` has a real model on at least `build.standard`
 * and `decide.sensitive` for one provider, and root AGENTS.md points at it.
 * A leftover `.agents/model-routing.md` still passes, with a deprecation note,
 * until that file is dropped two minors later.
 */
function routing(root: string, issues: Issue[]): void {
  const policyPath = join(root, ".agents/tokenomics.md");
  const legacyPath = join(root, ".agents/model-routing.md");
  const agentsPath = join(root, "AGENTS.md");
  const agents = text(agentsPath) ?? "";
  const policyText = text(policyPath);
  const parsed = policyText !== undefined ? parseTokenomics(policyText) : undefined;
  if (parsed?.ok === true && hasFilledCells(parsed.value)) {
    if (!/tokenomics/iu.test(agents)) {
      issues.push({ path: agentsPath, message: "D4 tokenomics: root AGENTS.md does not point at .agents/tokenomics.md" });
    }
    return;
  }
  const legacy = text(legacyPath);
  if (legacy !== undefined) {
    const legacyIssues: Issue[] = [];
    if (!/provider[^\n]*\b(cursor|claude|codex|muse)\b/iu.test(legacy)) {
      legacyIssues.push({ path: legacyPath, message: "D4 tokenomics: name the provider this runs on (cursor, claude, codex or muse)" });
    }
    if (!/\bscout\b/iu.test(legacy) || !/\blead\b/iu.test(legacy)) {
      legacyIssues.push({ path: legacyPath, message: "D4 tokenomics: define at least the scout (cheap reading) and lead (synthesis) tiers" });
    }
    if (!/model[- ]routing|tokenomics/iu.test(agents)) {
      legacyIssues.push({
        path: agentsPath,
        message: "D4 tokenomics: root AGENTS.md does not point at .agents/tokenomics.md (legacy .agents/model-routing.md is accepted with a deprecation note)",
      });
    }
    if (legacyIssues.length === 0) {
      issues.push({ path: legacyPath, message: LEGACY_NOTE });
      return;
    }
    if (policyText === undefined) {
      issues.push(...legacyIssues);
      return;
    }
  }
  if (policyText !== undefined) {
    issues.push({
      path: policyPath,
      message:
        "D4 tokenomics: .agents/tokenomics.md must set a real model (not inherit) on providers.<provider>.build.standard and providers.<provider>.decide.sensitive",
    });
    if (!/tokenomics/iu.test(agents)) {
      issues.push({ path: agentsPath, message: "D4 tokenomics: root AGENTS.md does not point at .agents/tokenomics.md" });
    }
    return;
  }
  issues.push({
    path: policyPath,
    message:
      "D4 tokenomics: no .agents/tokenomics.md (fill providers.<provider>.build.standard and providers.<provider>.decide.sensitive from the tool's model list, then point root AGENTS.md at it)",
  });
}

/** Opt-in (`validate --setup`): the four v3 depth axes, as issues a v2-style setup fails. */
export function checkDepth(root: string): Issue[] {
  const issues: Issue[] = [];
  reading(root, issues);
  rules(root, issues);
  nested(root, issues);
  ruleMap(root, issues);
  routing(root, issues);
  return issues;
}
