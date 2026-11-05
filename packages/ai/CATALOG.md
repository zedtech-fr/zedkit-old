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
real `.cursor/skills` dir, agents and commands as real-file copies),
`claude` (`CLAUDE.md` and folder links, or per-skill links and copies inside pre-existing real dirs), `codex` and `muse` (no
layer: read the shared source directly; same for other no-layer ids in `--help`).

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

CLI equivalent: `zedkit-ai validate` (accepts a project root too; reports drift). Opt-in `--setup` / `--plan <file>`: PLAN must cover every git-changed path; setup-log gate logs must be well-formed; and the setup must have gone deep: a reading log (D1), domain rules with evidence, plus Identity rules when there is a UI (D2), a nested `AGENTS.md` that links them or a stated reason (D3), `.agents/model-routing.md` pointed at from `AGENTS.md` (D4).

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
