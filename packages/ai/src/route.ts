// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import {
  DEFAULT_NEEDS,
  KIT_HEADERS,
  readAgentHeader,
  readSidecar,
  type AgentHeader,
} from "./agent-header.js";
import { hasMarker, museIdentityName, museSourceName } from "./generate.js";
import {
  checkTokenomics,
  loadDefaults,
  mergeTokenomics,
  parseTokenomics,
  EFFORTS,
  STAKES,
  type Effort,
  type Gate,
  type Kind,
  type Needs,
  type PolicyProvider,
  type Stakes,
  type Tokenomics,
} from "./tokenomics.js";

export type NeedsSource = "call" | "agent" | "default";
export type KindSource = "call" | "hint" | "default";

export type RouteInput = {
  /** The call's kind. Omitted: the agent's `default_kind` hint, else `build`. */
  kind?: Kind;
  stakes: Stakes;
  /** Per-field overrides for this call (task or step `Needs:`, `--reasoning`, `--context`). */
  needs?: Partial<Needs>;
  /** The agent being invoked: its name and header (see `readAgentHeader`). */
  agent?: { name: string; header?: AgentHeader | undefined };
  /** Default: the policy's `default_provider`. */
  provider?: PolicyProvider;
};

/** The independent second review a `critical` task requires, routed as `check` at the `critical` column. */
export type SecondReview = {
  provider: PolicyProvider;
  model: string;
  effort: Effort;
  warning?: string;
};

export type Route = {
  provider: PolicyProvider;
  model: string;
  effort: Effort;
  /** Token count for `needs.context` from the provider's `context_windows`, when mapped. */
  contextWindow: string | number | undefined;
  kind: Kind;
  kindSource: KindSource;
  needs: Needs;
  needsSource: Record<keyof Needs, NeedsSource>;
  /** Stakes column the cell was read from (the task stakes after the needs shift and floors). */
  column: Stakes;
  /** Gates of the task's own stakes: needs and floors never change them. */
  gates: Gate;
  /** `check` calls must not write; the caller states it and verifies no file changed. */
  readOnly: boolean;
  /** No cell for this provider: the model is `inherit`. */
  unrouted: boolean;
  secondReview?: SecondReview;
  notes: string[];
};

const at = <T>(list: readonly T[], index: number): T =>
  list[Math.max(0, Math.min(list.length - 1, index))] as T;

function resolveNeeds(
  policy: Tokenomics,
  input: RouteInput,
  header: AgentHeader | undefined,
) {
  const needs = { ...(policy.default_needs ?? DEFAULT_NEEDS) } as Needs;
  const source: Record<keyof Needs, NeedsSource> = {
    reasoning: "default",
    context: "default",
  };
  for (const field of ["reasoning", "context"] as const) {
    const fromCall = input.needs?.[field];
    const fromAgent = header?.default_needs[field];
    if (fromCall !== undefined) {
      (needs[field] as string) = fromCall;
      source[field] = "call";
    } else if (fromAgent !== undefined) {
      (needs[field] as string) = fromAgent;
      source[field] = "agent";
    }
  }
  return { needs, source };
}

function resolveKind(
  input: RouteInput,
  header: AgentHeader | undefined,
  notes: string[],
): Result<{ kind: Kind; source: KindSource }> {
  const allowed = header?.kinds;
  let kind = input.kind;
  let source: KindSource = "call";
  if (kind === undefined) {
    kind = header?.default_kind;
    source = "hint";
    if (kind === undefined) {
      kind = "build";
      source = "default";
    }
    notes.push(`kind not given, using ${kind} (${source})`);
  }
  if (allowed && !allowed.includes(kind)) {
    return err(
      new Error(
        `${input.agent?.name ?? "agent"} cannot be invoked as ${kind} (allowed: ${allowed.join(", ")})`,
      ),
    );
  }
  return ok({ kind, source });
}

// One stakes column to the right when the call needs more thinking or more
// context. Capped at `sensitive` unless the task is already `critical`: the
// `critical` column is reached by a critical task or an agent floor only.
function shiftedColumn(stakes: Stakes, needs: Needs): Stakes {
  if (needs.reasoning !== "high" && needs.context !== "large") return stakes;
  if (stakes === "critical") return stakes;
  return at(
    STAKES,
    Math.min(STAKES.indexOf(stakes) + 1, STAKES.indexOf("sensitive")),
  );
}

export function secondReviewFor(
  policy: Tokenomics,
  provider: PolicyProvider,
  stakes: Stakes,
  column: Stakes,
): SecondReview | undefined {
  const gate = policy.gates[stakes];
  if (gate?.second_review !== "independent") return undefined;
  const p2 = gate.second_review_provider ?? provider;
  const cell = policy.providers[p2]?.check?.critical;
  const model = cell?.model ?? "inherit";
  // The first reviewer is `check` at the same column on the task's provider.
  const first = policy.providers[provider]?.check?.[column]?.model ?? "inherit";
  const review: SecondReview = {
    provider: p2,
    model,
    effort: cell?.effort ?? "medium",
  };
  if (gate.distinct_model === true && model === first) {
    review.warning =
      model === "inherit"
        ? "cannot prove distinct model: both reviews inherit; name the model the second session used on the Second review line"
        : "second review resolves to the same model as the first review; pin second_review_provider or give check.critical another model";
  }
  return review;
}

/**
 * Resolve one call to a model and effort. Inputs: the call's `kind`, the task
 * `stakes`, the effective `needs`, the agent and the provider. The result
 * always carries the gates of the task's own stakes; routing never changes
 * them. Errors: no provider, or a kind outside the agent's `kinds`.
 */
export function resolveRoute(
  policy: Tokenomics,
  input: RouteInput,
): Result<Route> {
  const provider = input.provider ?? policy.default_provider;
  if (provider === undefined)
    return err(
      new Error(
        "no provider: pass one or set default_provider in .agents/tokenomics.md",
      ),
    );
  const header = input.agent?.header;
  const notes: string[] = [];
  const kind = resolveKind(input, header, notes);
  if (!kind.ok) return err(kind.error);
  const { needs, source } = resolveNeeds(policy, input, header);
  const name = input.agent?.name;
  let column = shiftedColumn(input.stakes, needs);
  const floorStakes =
    (name !== undefined ? policy.agents?.[name]?.min_stakes : undefined) ??
    header?.min_stakes;
  if (
    floorStakes !== undefined &&
    STAKES.indexOf(floorStakes) > STAKES.indexOf(column)
  )
    column = floorStakes;
  const cell = policy.providers[provider]?.[kind.value.kind]?.[column];
  const unrouted = cell === undefined;
  let effortIndex = EFFORTS.indexOf(cell?.effort ?? "medium");
  if (
    needs.reasoning === "low" &&
    (input.stakes === "trivial" || input.stakes === "standard")
  )
    effortIndex -= 1;
  const floorEffort =
    (name !== undefined ? policy.agents?.[name]?.min_effort : undefined) ??
    header?.min_effort;
  if (floorEffort !== undefined)
    effortIndex = Math.max(effortIndex, EFFORTS.indexOf(floorEffort));
  const model = cell?.model ?? "inherit";
  const window = policy.providers[provider]?.context_windows?.[needs.context];
  if (window === undefined)
    notes.push(`no context_windows.${needs.context} for ${provider}`);
  if (unrouted)
    notes.push(
      `no ${kind.value.kind}.${column} cell for ${provider}: model inherit`,
    );
  const route: Route = {
    provider,
    model,
    effort: at(EFFORTS, effortIndex),
    contextWindow: window,
    kind: kind.value.kind,
    kindSource: kind.value.source,
    needs,
    needsSource: source,
    column,
    gates: policy.gates[input.stakes],
    readOnly: kind.value.kind === "check",
    unrouted,
    notes,
  };
  const second = secondReviewFor(policy, provider, input.stakes, column);
  if (second) route.secondReview = second;
  return ok(route);
}

/**
 * The effective policy of a project: the shipped defaults with the project's
 * `<agentsDir>/tokenomics.md` merged over them. An invalid project file is an
 * error (the same problems `validate` reports), never a silent fallback.
 */
export function loadPolicy(agentsDir: string): Result<Tokenomics> {
  const defaults = loadDefaults();
  if (!defaults.ok) return err(defaults.error);
  const file = join(agentsDir, "tokenomics.md");
  if (!existsSync(file)) return ok(defaults.value);
  const text = tryCatch(() => readFileSync(file, "utf8"));
  if (!text.ok)
    return err(new Error(`cannot read tokenomics.md: ${text.error.message}`));
  const issues = checkTokenomics(text.value, defaults.value);
  if (issues.length > 0)
    return err(
      new Error(issues.map((issue) => `tokenomics.md: ${issue}`).join("; ")),
    );
  const layer = parseTokenomics(text.value);
  return layer.ok
    ? ok(mergeTokenomics(defaults.value, layer.value))
    : err(layer.error);
}

/**
 * The agent to route: its name and header, read from the `agents.meta.json`
 * entry of `agentsDir` when it has one (see `readAgentHeader`). A kit agent
 * routes from the shipped table when the project has no entry. A Muse dest
 * shares the kit source identity only with provenance (generated marker, or
 * dest missing while the unmarked source exists). An unmarked dest homonym
 * is its own agent. A name that is neither installed, nor a kit agent, nor a
 * provenanced alias, nor in the sidecar is an error.
 */
export function loadAgent(
  agentsDir: string,
  name: string,
): Result<{ name: string; header: AgentHeader; note?: string }> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
    return err(new Error(`invalid agent name "${name}"`));
  const sidecar = readSidecar(agentsDir);
  if (!sidecar.ok) return err(sidecar.error);
  const mapped = museSourceName(name);
  const file = join(agentsDir, "agents", `${name}.md`);
  const sourceFile = join(agentsDir, "agents", `${mapped}.md`);
  const destRead = tryCatch(() => readFileSync(file, "utf8"));
  const sourceRead = tryCatch(() => readFileSync(sourceFile, "utf8"));
  const sources = new Set<string>();
  if (sourceRead.ok && !hasMarker(sourceRead.value)) sources.add(mapped);
  const identity = museIdentityName(name, {
    sources,
    ...(destRead.ok && { destText: destRead.value }),
  });
  const identityFile = join(agentsDir, "agents", `${identity}.md`);
  const entry = identity === name ? sidecar.value[name] : sidecar.value[name] ?? sidecar.value[identity];
  if (
    !existsSync(file) &&
    !existsSync(identityFile) &&
    entry === undefined &&
    KIT_HEADERS[name] === undefined &&
    KIT_HEADERS[identity] === undefined
  )
    return err(new Error(`unknown agent "${name}" (no ${file})`));
  const read = readAgentHeader(identity, entry);
  return ok({
    name,
    header: read.header,
    ...(read.note !== undefined && { note: read.note }),
  });
}
