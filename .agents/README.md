# AI setup of this repo

This repo uses its own [`@zedtech/zedkit-ai`](../packages/ai/README.md) kit: the
skills and subagents in `packages/ai/kit/` are the single source of truth.

- `.agents/skills` and `.agents/agents` are symlinks into `packages/ai/kit/`.
- `.claude/` and `.cursor/` link to `.agents/` (skills and agents); `CLAUDE.md`
  links to `AGENTS.md`.
- Instructions: root `AGENTS.md`, plus a nested `AGENTS.md` in each package,
  `apps/docs` and `deploy/suggest`. `.cursor/rules/*.mdc` only points at them.
- `personas.md`: the audiences `persona-review` picks from. A PR body fills
  the Personas table of `.github/pull_request_template.md` instead (its rows
  differ; CI counts the verdicts).

Edit skills and agents in `packages/ai/kit/`, then run
`pnpm exec turbo run test --filter=@zedtech/zedkit-ai` (it builds the sibling
packages first, validates the whole kit and checks that the links above
resolve). Licences and credits of vendored skills:
`packages/ai/kit/THIRD_PARTY_NOTICES.md`.
