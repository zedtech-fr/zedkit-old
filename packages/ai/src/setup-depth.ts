// Original work by the same author.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { listRepoFiles, minReaders, scanRepo } from "./scan.js";
import type { Issue } from "./validate.js";

// A cited line: path/to/file.ext:42
const EVIDENCE = /[\w./@-]+\.[A-Za-z0-9]+:\d+/u;

function text(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const raw = tryCatch(() => readFileSync(path, "utf8"));
  return raw.ok ? raw.value : undefined;
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
}

const UI_FILE = /\.(tsx|jsx|vue|svelte|css|scss)$/u;

/** The `## Identity rules` section of design.md: heading to the next `## `. */
function identitySection(design: string): string | undefined {
  const at = design.search(/^#{2,3} Identity rules\b/mu);
  if (at < 0) return undefined;
  const rest = design.slice(at).split("\n").slice(1).join("\n");
  return rest.split(/^## /mu)[0];
}

/** D2: domain rules (each citing code or the owner), and identity rules when the repo has a UI. */
function rules(root: string, issues: Issue[]): void {
  const dir = join(root, ".agents/domain");
  const listed = tryCatch(() => readdirSync(dir));
  const files = listed.ok ? listed.value.filter((f) => f.endsWith(".md") && !f.endsWith(".kit.md") && !f.endsWith(".template.md")) : [];
  if (files.length === 0) {
    issues.push({ path: dir, message: "D2 domain rules: no .agents/domain/*.md (business and invariant rules extracted from the code)" });
  }
  for (const file of files) {
    const body = text(join(dir, file)) ?? "";
    if (!EVIDENCE.test(body) && !body.includes("source: owner")) {
      issues.push({ path: join(dir, file), message: "D2 domain rules: no file:line or `source: owner` evidence" });
    }
  }
  if (!listRepoFiles(root).some((p) => UI_FILE.test(p))) return;
  const path = join(root, ".agents/design.md");
  const identity = identitySection(text(path) ?? "");
  if (identity === undefined) {
    issues.push({ path, message: "D2 identity rules: the repo has a UI but .agents/design.md has no `## Identity rules` section (brand, voice and naming rules read from the code)" });
  } else if (!EVIDENCE.test(identity) && !identity.includes("source: owner")) {
    issues.push({ path, message: "D2 identity rules: no file:line or `source: owner` evidence in the Identity rules section" });
  }
}

/** D3: nested AGENTS.md wired to the setup's rules (links `.agents/`), or a stated `nested-agents:` decision in the setup-log. */
function nested(root: string, issues: Issue[]): void {
  const files = listRepoFiles(root).filter((p) => p.includes("/") && p.endsWith("/AGENTS.md"));
  if (files.some((f) => /\.agents\/(domain|design|product|model-routing)/u.test(text(join(root, f)) ?? ""))) return;
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

/** D4: model routing is written down, names its provider and tiers, and the root AGENTS.md points at it. */
function routing(root: string, issues: Issue[]): void {
  const path = join(root, ".agents/model-routing.md");
  const body = text(path);
  if (body === undefined) {
    issues.push({ path, message: "D4 model routing: no .agents/model-routing.md (provider, scout/worker/lead tiers, how each spawn picks its model)" });
    return;
  }
  if (!/provider[^\n]*\b(cursor|claude|codex|muse)\b/iu.test(body)) {
    issues.push({ path, message: "D4 model routing: name the provider this runs on (cursor, claude, codex or muse)" });
  }
  if (!/\bscout\b/iu.test(body) || !/\blead\b/iu.test(body)) {
    issues.push({ path, message: "D4 model routing: define at least the scout (cheap reading) and lead (synthesis) tiers" });
  }
  if (!/model[- ]routing/iu.test(text(join(root, "AGENTS.md")) ?? "")) {
    issues.push({ path: join(root, "AGENTS.md"), message: "D4 model routing: root AGENTS.md does not point at .agents/model-routing.md" });
  }
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
