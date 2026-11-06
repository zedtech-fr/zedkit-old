# Catalog — @zedtech/zedkit-ai

- Keywords: ai, agents, agents-md, skills, subagents, cursor, claude-code, codex, coding-assistant, setup, scaffolding, opencode
- Audience: Teams running coding agents (Cursor, Claude, Codex and more) who want one shared setup.
- Purpose: Install one agent-agnostic setup (AGENTS.md, skills, subagents, commands) with a single CLI, instead of maintaining per-tool config.
- Attribution: Original work by the same author.

## Set up AI agent instructions, skills, subagents and commands in a repo

- Import: `@zedtech/zedkit-ai` — `installKit`, `InstallOptions`, `Action`, `Provider`, `Target`
- Wraps: `(none)`
- Status: stable
- Short name: Agent setup
- Audience: Teams onboarding a coding agent (Cursor, Claude, Codex) on a shared repo.
- Purpose: Install one agent-agnostic setup (instructions, skills, subagents, commands) with a single CLI call.
- When to use: When every developer and agent should share the same instructions and review workflow.
- When not to use: When you only need one provider's config — write that provider's file by hand instead.
- See also: `Check that skills, subagents, commands and provider copies are valid`

```ts
import { installKit } from "@zedtech/zedkit-ai";
const result = installKit({
  dest: ".",
  preset: "core",
  providers: ["claude", "cursor"],
});
if (!result.ok) throw result.error;
for (const action of result.value) console.log(action.kind, action.path);
```

CLI equivalent: `zedkit-ai setup . --provider cursor` (onboarding: **`--preset setup` by default**, same as `init --preset setup --adopt`) or `zedkit-ai init .` (`--provider cursor,claude,codex,all`; `--target` is an alias; `--adopt` keeps colliding user files and skips identical kit copies; run `--help` for every provider id)

Presets: `starter` (onboard + review + test-first; default), `setup` (starter plus domain,
review lenses, retro, rules-upkeep, product/UI/copy subagents, and setup-ai
`templates/` under `.agents/skills/setup-ai/`, including the setup rubric and
score-and-learn templates), `core`
(planning and implement entry points), `full` (every skill).

Providers: `cursor` (rules file, skills link or per-skill links inside a
real `.cursor/skills` dir, generated agent files, command links),
`claude` (`CLAUDE.md` and folder links, or per-skill links and copies inside pre-existing real dirs, generated agents), `codex` (no
layer: reads the shared source directly), `muse` (native marked files in `.agents/agents`; unmarked/kit stay the source).

## Check that skills, subagents, commands and provider copies are valid

- Import: `@zedtech/zedkit-ai` — `validateKit`, `checkDrift`, `Issue`
- Wraps: `yaml`
- Status: stable
- Short name: Kit validation
- Audience: Teams keeping an installed agent setup healthy across providers.
- Purpose: Validate installed skills, subagents and commands, report drift between providers without asking to overwrite user files, and flag kit skills a provider layer does not expose.
- When to use: In CI and after editing shared agent files, to catch invalid or drifted copies.
- When not to use: For one-off local edits — run the install command again instead of validating by hand.
- See also: `Set up AI agent instructions, skills, subagents and commands in a repo`

```ts
import { checkDrift, validateKit } from "@zedtech/zedkit-ai";
const issues = [...validateKit(".agents"), ...checkDrift(".", ".agents")];
for (const issue of issues) console.error(`${issue.path}: ${issue.message}`);
```

CLI equivalent: `zedkit-ai validate` (accepts a project root too; reports drift). Opt-in `--setup` / `--plan <file>`: PLAN must cover every git-changed path; setup-log gate logs must be well-formed; and the setup must have gone deep: a reading log (D1), domain rules with evidence, plus Identity rules when there is a UI (D2), a nested `AGENTS.md` that links them or a stated reason (D3), `.agents/tokenomics.md` with a real model on `build.standard` and `decide.sensitive`, pointed at from `AGENTS.md` (D4).

Need: size a repo and cut it for parallel read-only readers. CLI: `zedkit-ai scan [dir]` prints the size class (small, medium, large), the reader count (1-5, 6-10, 11-20) and one slice per reader.

## Run one gate command and keep a log that setup validation accepts

- Import: `@zedtech/zedkit-ai` — `runGate`, `GateOptions`, `GateResult`, `GateCause`
- Wraps: `(none)`
- Status: stable
- Short name: Gate log
- Audience: Agents and maintainers who run lint, test or build gates and need the result as evidence.
- Purpose: Run a shell command and write a gate log in the `CMD:` / `START:` / `END:` / `EXIT:<code>` shape that `zedkit-ai validate --setup` checks, with the V8 heap capped and a `CAUSE:` line when the command times out, is killed or runs out of memory.
- When to use: When a setup run, a handoff or a PR cites a gate and the log must outlive the chat.
- When not to use: For interactive commands or when a CI job already stores its own log.
- See also: `Check that skills, subagents, commands and provider copies are valid`

```ts
import { runGate } from "@zedtech/zedkit-ai";
const result = await runGate({
  cmd: "pnpm exec turbo run test --concurrency=2",
  log: ".agents/setup-log/gates/test.log",
  timeoutMs: 20 * 60_000,
});
if (!result.ok) throw result.error;
process.exitCode = result.value.code;
```

CLI equivalent: `zedkit-ai gate .agents/setup-log/gates/test.log -- pnpm exec turbo run test --concurrency=2` (exits with the command's code, output goes straight to the file).

## Route an agent call to a model and effort from a policy file

- Import: `@zedtech/zedkit-ai` — `resolveRoute`, `RouteInput`, `Route`, `SecondReview`, `KindSource`, `NeedsSource`, `AgentHeader`, `Tokenomics`, `Kind`, `Stakes`, `Effort`, `Needs`, `Reasoning`, `ContextSize`, `Review`, `Cell`, `PolicyProvider`, `ProviderPolicy`, `AgentFloor`, `HardcodeConfig`, `KINDS`, `STAKES`, `EFFORTS`, `REASONING`, `CONTEXT_SIZES`, `REVIEWS`, `POLICY_PROVIDERS`
- Wraps: `(none)`
- Status: beta
- Short name: Agent routing
- Audience: Agents and maintainers who pick a model per subagent call from one policy instead of hardcoding it.
- Purpose: Resolve kind (how the agent is used for this call) times stakes (how much is at risk) and the call's needs to a provider's model and effort, with the gates of those stakes and the second review route for critical work.
- When to use: Before spawning a subagent, when the project keeps its model policy in `.agents/tokenomics.md`.
- When not to use: When one session model is fine for everything, leave every cell on `inherit`.
- See also: `Set up AI agent instructions, skills, subagents and commands in a repo`

```ts
import { resolveRoute } from "@zedtech/zedkit-ai";
// `policy` is the project's tokenomics.md merged over the shipped defaults.
const route = resolveRoute(policy, {
  kind: "check",
  stakes: "standard",
  provider: "cursor",
});
if (!route.ok) throw route.error;
console.log(route.value.model, route.value.effort, route.value.gates.review);
```

CLI equivalent: `zedkit-ai route verifier --kind check --stakes sensitive --provider cursor --json`.

The stakes come from the task file: `zedkit-ai stakes PLAN.md --base origin/main` reads `Stakes:`, `Kind:` and `Needs:`, prints the gates, and fails when stakes were lowered, raised without a reason, or `critical` lacks its second-review and human-validation lines.

## Write each tool's agent files from one source and a policy

- Import: `@zedtech/zedkit-ai` — `syncKit`, `inSync`, `SyncOptions`, `Action`
- Wraps: `(none)`
- Status: beta
- Short name: Agent file sync
- Audience: Maintainers who keep subagents in `.agents/agents` and want each tool's copy to carry the model from one policy file.
- Purpose: Generate `.cursor/agents`, `.claude/agents`, and Muse-native files in `.agents/agents` from the unmarked/kit source and `.agents/tokenomics.md`, with the model of each agent's default route and a marker so a later run can tell its own files from yours; never overwrite a file it did not write.
- When to use: After editing an agent or `tokenomics.md`, after upgrading the kit, and as a `--check` step in CI.
- When not to use: When every agent runs on the session model and no tool needs its own copy. Codex reads `.agents` directly. Muse gets a native marked file in `.agents/agents` (not the canonical source).
- See also: `Route an agent call to a model and effort from a policy file`

```ts
import { inSync, syncKit } from "@zedtech/zedkit-ai";
const actions = syncKit({ dest: ".", providers: ["cursor", "claude"], check: true });
if (!actions.ok) throw actions.error;
if (!inSync(actions.value)) process.exitCode = 1;
```

CLI equivalent: `zedkit-ai sync --provider cursor,claude --check`.
