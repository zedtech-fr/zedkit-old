# Set up zedkit AI in this repository (Cursor)

Agent-executable onboarding. Follow these steps in order in the **current repo root**. Do not ask how to begin.

## Goal

Install `@zedtech/zedkit-ai`, wire Cursor with adopt mode, run `/setup-ai` to tailor `AGENTS.md` to this repo, then validate.

## Steps

1. **Install the package** (skip if `@zedtech/zedkit-ai` is already in `devDependencies`):

   ```sh
   pnpm add -D @zedtech/zedkit-ai
   ```

   When **`pnpm-workspace.yaml`** exists at the repo root, use **`pnpm add -D -w @zedtech/zedkit-ai`** instead (avoids `ERR_PNPM_ADDING_TO_ROOT`).

   Use `npm install -D @zedtech/zedkit-ai` when the repo has no pnpm lockfile.

2. **Install the kit with adopt** (keeps existing agent files on name collision — kit copies land beside yours as `*.kit.md` / `zk-<name>`; **`setup` uses the `setup` preset by default** — override with `--preset` when needed):

   ```sh
   npx zedkit-ai setup --provider cursor
   ```

   Use another provider name if the user specified one (`claude`, `codex`, `muse`, or comma-separated).

3. **Run setup-ai** (repo audit, discovery interview, plan, and tailored instructions):

   - In Cursor: run **`/setup-ai`** (or ask the agent to run the `setup-ai` skill). Read the skill, then print its intro first — before any repo reads, inventory, or writes — and **continue in the same turn** straight into phase A without waiting for a reply. The only stop points are the phase B batched interview, plan approval before writes, and the final report.
   - Follow the skill through **verify**: run the gate commands it lists, apply the approved plan, finish the report.
   - Phase **B** starts by **reading the code**, not by asking: the agent runs `npx zedkit-ai scan`, then spawns read-only subagents on a cheap, fast model (1–5 on a small repo, 10–20 on a big one) that report the rules already in place with `file:line` evidence. It writes them to domain rules, nested `AGENTS.md` files and `.agents/tokenomics.md`, then runs `zedkit-ai sync`, so later agent work in the repo keeps the same cheap-reads, strong-decides split.
   - Then **answer or delegate the batched discovery interview** (at most 8 questions in one batch, only what the code could not answer); do not skip the interview or substitute guesses for owner answers.

4. **Validate**:

   ```sh
   npx zedkit-ai validate
   ```

   **Done when** exit code is `0` and stdout is exactly:

   ```text
   ok
   ```

   Fix every reported path until validate is clean. If the repo uses Prettier, add the kit paths from the CLI **`prettier:`** hint to `.prettierignore` (or approve that row in the setup-ai plan) so `prettier --check .` stays green.

   For a deeper check, `npx zedkit-ai validate --setup` also verifies the setup went deep: a reading log, domain rules, nested `AGENTS.md` and model routing.

## Rules

- Use **`setup`**, not bare `init`, when the repo may already have agent files — adopt keeps user content.
- Do not skip **`/setup-ai`** — install alone is not a finished setup.
- During setup-ai, follow **evidence only** (`ground-truth`): commands and paths must be verified, not guessed.

## Workspace roots

If this folder holds **several git checkouts** (multi-repo workspace), run **`/setup-ai` in workspace mode** at the root; run a separate setup inside each app repo the inventory lists.
