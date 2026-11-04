# Set up zedkit AI in this repository (Cursor)

Agent-executable onboarding. Follow these steps in order in the **current repo root**. Do not ask how to begin.

## Goal

Install `@zedtech/zedkit-ai`, wire Cursor with adopt mode, run `/setup-ai` to tailor `AGENTS.md` to this repo, then validate.

## Steps

1. **Install the package** (skip if `@zedtech/zedkit-ai` is already in `devDependencies`):

   ```sh
   pnpm add -D @zedtech/zedkit-ai
   ```

   Use `npm install -D @zedtech/zedkit-ai` when the repo has no pnpm lockfile.

2. **Install the kit with adopt** (keeps existing agent files on name collision; **`setup` uses the `setup` preset by default** — override with `--preset` when needed):

   ```sh
   npx zedkit-ai setup --provider cursor
   ```

   Use another provider name if the user specified one (`claude`, `codex`, `muse`, or comma-separated).

3. **Run setup-ai** (repo audit, plan, and tailored instructions):

   - In Cursor: run **`/setup-ai`** (or ask the agent to run the `setup-ai` skill).
   - Follow the skill through **verify**: run the gate commands it lists, apply the approved plan, finish the report.
   - If the skill asks one question (providers or role/language), answer briefly and continue.

4. **Validate**:

   ```sh
   npx zedkit-ai validate
   ```

   **Done when** exit code is `0` and stdout is exactly:

   ```text
   ok
   ```

   Fix every reported path until validate is clean.

## Rules

- Use **`setup`**, not bare `init`, when the repo may already have agent files — adopt keeps user content.
- Do not skip **`/setup-ai`** — install alone is not a finished setup.
- During setup-ai, follow **evidence only** (`ground-truth`): commands and paths must be verified, not guessed.

## Workspace roots

If this folder holds **several git checkouts** (multi-repo workspace), run **`/setup-ai` in workspace mode** at the root; run a separate setup inside each app repo the inventory lists.
