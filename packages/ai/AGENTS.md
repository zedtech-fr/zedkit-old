# AGENTS.md — @zedtech/zedkit-ai

1. Two parts: `kit/` (markdown and JSON shipped as data) and `src/` (a
   small installer, validator and CLI). Runtime deps: `@zedtech/zedkit-core`,
   `yaml`.
2. `kit/` is the single source of truth for this repo's own skills and
   unmarked subagent text (`.agents/skills` symlink into it; generated
   agent files come from `sync`). Edit kit sources there;
   `tests/unit/repo-wiring.test.ts` fails when a skills link stops
   resolving to the kit or generated agents miss a kit name.
3. Agent-agnostic: no tool-specific paths or model ids inside skills or
   subagents. Subagent `model` is omitted or `inherit`; descriptions are
   one line; names equal the folder or file name. `validateKit` enforces
   it and the tests run it on the whole kit.
   The kit ships to other repos: it carries general lessons only (validate
   generated output at both ends, no hand-written install snippets). This
   repo's folders, commands and traps belong in `AGENTS.md` files, not here.
   A change to shipped `kit/` content needs a patch changeset for this package.
4. Never name a private project, customer, vendor or internal URL in the
   kit (CI denylist: `scripts/check-no-private-refs.sh`). Examples use
   generic names.
5. Vendored skills stay verbatim. Any edit is listed under Modifications
   in `kit/THIRD_PARTY_NOTICES.md`, and new vendored skills get their
   licence file next to them.
6. First-party skills: imperative, short, one job, the trigger in the
   `description` ("Use when ..."). Add one only if no existing skill or
   subagent fits; a preset entry only if most projects benefit. A `Skill
   tool` call carries the shared SKILL.md fallback on the same line
   (`tests/unit/skill-content.test.ts`). Presets stay reference-closed:
   setup ships the plan/implement playbooks, starter stays lean
   (`tests/unit/preset-closure.test.ts`).
7. Installer never overwrites. `--adopt` keeps a different user file and
   writes a kit sidecar (`*.kit.md` or `zk-<name>`); a copy that already
   matches the kit is skipped. Per-skill provider links cover dirs that
   exist under `.agents/skills`, not only the preset list. New behavior
   needs a test in `tests/unit/install.test.ts`.
8. Explicit named exports in `src/index.ts`, each in `CATALOG.md`.
9. Definition of done: `pnpm --filter @zedtech/zedkit-ai typecheck && pnpm --filter @zedtech/zedkit-ai lint && pnpm --filter @zedtech/zedkit-ai build && pnpm --filter @zedtech/zedkit-ai test`
   green (each separately), `pnpm catalog:check` green. On a fresh clone build
   the sibling packages first (see Commands in the root `AGENTS.md`).

## Domain and identity

- Own-install and sync rules: [ai-kit.md](../../.agents/domain/ai-kit.md)
- Public hygiene: [public-hygiene.md](../../.agents/domain/public-hygiene.md)
- Tokenomics (root): [tokenomics.md](../../.agents/tokenomics.md)
- Cursor pointer: [packages-ai.mdc](../../.cursor/rules/packages-ai.mdc) only
  names this file.
