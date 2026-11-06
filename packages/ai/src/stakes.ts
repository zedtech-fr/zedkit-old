// Original work by the same author.
import { execFileSync } from "node:child_process";
import { basename, dirname } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { parseFrontmatter } from "./frontmatter.js";
import { secondReviewFor, type SecondReview } from "./route.js";
import {
  CONTEXT_SIZES,
  KINDS,
  REASONING,
  STAKES,
  type Gate,
  type Kind,
  type Needs,
  type PolicyProvider,
  type Stakes,
  type Tokenomics,
} from "./tokenomics.js";

// A task header line: `Stakes: x`, `**Stakes:** x`, `- Stakes: x`, `> Stakes: x`.
// `Stakes raised: ...` never matches (the word before the colon is not `stakes`).
const line = (name: string): RegExp =>
  new RegExp(`^[ \\t>*_-]*${name}[*_]*[ \\t]*:[*_]*[ \\t]*(.*)$`, "im");

const RAISED = line("stakes raised");

function frontmatterOf(text: string): Record<string, unknown> {
  const front = parseFrontmatter(text);
  return front.ok ? front.value.data : {};
}

// Frontmatter key first, then the first header line in the body.
function raw(text: string, key: string): string | undefined {
  const fromFront = frontmatterOf(text)[key];
  if (typeof fromFront === "string") return fromFront;
  const hit = line(key).exec(text);
  return hit?.[1]?.trim();
}

function oneOf<T extends string>(
  domain: readonly T[],
  value: string,
  label: string,
): Result<T> {
  const word = value.trim().replace(/[*_`]/g, "").toLowerCase();
  return (domain as readonly string[]).includes(word)
    ? ok(word as T)
    : err(new Error(`${label}: "${value.trim()}" is not one of ${domain.join(", ")}`));
}

/** `stakes:` (frontmatter) or a `Stakes:` line. Undefined when absent; an error for an unknown value. */
export function parseStakes(text: string): Result<Stakes | undefined> {
  const value = raw(text, "stakes");
  return value === undefined || value === ""
    ? ok(undefined)
    : oneOf(STAKES, value, "stakes");
}

/** `kind:` (frontmatter) or a `Kind:` line: how the agent is used for this task or step. */
export function parseKind(text: string): Result<Kind | undefined> {
  const value = raw(text, "kind");
  return value === undefined || value === ""
    ? ok(undefined)
    : oneOf(KINDS, value, "kind");
}

/**
 * `needs: { reasoning, context }` (frontmatter) or a
 * `Needs: reasoning=high, context=large` line. Either field may be given
 * alone; the other falls back to the agent's default needs.
 */
export function parseNeeds(text: string): Result<Partial<Needs>> {
  const front = frontmatterOf(text).needs;
  const pairs: [string, string][] = [];
  if (front !== null && typeof front === "object" && !Array.isArray(front)) {
    for (const [key, value] of Object.entries(front))
      pairs.push([key, String(value)]);
  } else {
    const hit = line("needs").exec(text);
    for (const part of (hit?.[1] ?? "").split(",")) {
      if (part.trim() === "") continue;
      const [key, value] = part.split(/[=:]/);
      pairs.push([(key ?? "").trim(), (value ?? "").trim()]);
    }
  }
  const needs: Partial<Needs> = {};
  for (const [key, value] of pairs) {
    if (key === "reasoning") {
      const word = oneOf(REASONING, value, "needs.reasoning");
      if (!word.ok) return word;
      needs.reasoning = word.value;
    } else if (key === "context") {
      const word = oneOf(CONTEXT_SIZES, value, "needs.context");
      if (!word.ok) return word;
      needs.context = word.value;
    } else {
      return err(new Error(`needs.${key}: unknown key (use reasoning or context)`));
    }
  }
  return ok(needs);
}

/**
 * Stakes only go up. `prev` undefined is always fine (nothing to compare,
 * so a triage that starts at `sensitive` needs no explanation). Lowering is
 * an error; raising needs a `Stakes raised: a -> b: <reason>` line in `text`.
 */
export function checkStakesChange(
  prev: Stakes | undefined,
  next: Stakes,
  text = "",
): string[] {
  if (prev === undefined) return [];
  const from = STAKES.indexOf(prev);
  const to = STAKES.indexOf(next);
  if (to < from)
    return [`stakes lowered from ${prev} to ${next}: stakes only go up`];
  if (to > from) {
    const reason = RAISED.exec(text)?.[1]?.trim() ?? "";
    if (reason === "")
      return [
        `stakes raised from ${prev} to ${next} without a "Stakes raised: ${prev} -> ${next}: <reason>" line`,
      ];
  }
  return [];
}

export type TaskGates = {
  gate: Gate;
  /** Only for a `critical` task: the independent reviewer's route, with its warning when it cannot be proven distinct. */
  secondReview?: SecondReview;
};

/** The gates of a task's own stakes. Needs, kind and agent floors never change them. */
export function gatesFor(
  policy: Tokenomics,
  stakes: Stakes,
  provider?: PolicyProvider,
): TaskGates {
  const gate = policy.gates[stakes];
  const p = provider ?? policy.default_provider;
  const secondReview =
    p === undefined ? undefined : secondReviewFor(policy, p, stakes, stakes);
  return secondReview === undefined ? { gate } : { gate, secondReview };
}

const PLACEHOLDER = /^(<.*>|tbd|todo|n\/a|-)$/i;

/** What a `critical` task must also carry in its body: a second review and a human validation line. */
export function checkCriticalLines(text: string): string[] {
  const issues: string[] = [];
  for (const [name, label] of [
    ["second review", "Second review"],
    ["human validation", "Human validation"],
  ] as const) {
    const value = line(name).exec(text)?.[1]?.trim() ?? "";
    if (value === "" || PLACEHOLDER.test(value))
      issues.push(`critical stakes need a "${label}:" line with a value`);
  }
  return issues;
}

/** The file's text at a git ref, or undefined when the file did not exist there. A bad ref is an error. */
export function readAtRef(file: string, ref: string): Result<string | undefined> {
  const cwd = dirname(file);
  const checked = tryCatch(() =>
    execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  if (!checked.ok) return err(new Error(`not a git ref: ${ref}`));
  const shown = tryCatch(() =>
    execFileSync("git", ["show", `${ref}:./${basename(file)}`], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  return ok(shown.ok ? shown.value : undefined);
}
