# Catalog — @zedtech/zedkit-ai

- Keywords: ai, agents, agents-md, skills, subagents, cursor, claude-code, codex, coding-assistant, setup, scaffolding, opencode
- Audience: Teams running coding agents (Cursor, Claude, Codex and more) who want one shared setup.
- Purpose: Install one agent-agnostic setup (AGENTS.md, skills, subagents, commands) with a single CLI, instead of maintaining per-tool config.
- Attribution: Original work by the same author.

## Set up AI agent instructions, skills, subagents and commands in a repo

- Import: `@zedtech/zedkit-ai` — `installKit`, `InstallOptions`, `Action`, `Provider`, `Target`
- Wraps: `(none)`
- Status: beta
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
- Status: beta
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

CLI equivalent: `zedkit-ai validate` (accepts a project root too; reports drift)
