# Domain — AI kit (own install)

This repo dogfoods `@zedtech/zedkit-ai`. `packages/ai/kit/` is the source
of skills and unmarked subagent text. Do not write through the
`.agents/skills` directory symlink into the kit.

## Rules

| ID | Status | Rule | Source | Test | Enforced by |
| -- | ------ | ---- | ------ | ---- | ----------- |
| A-01 | current | `.agents/skills` (and `.claude/skills`, `.cursor/skills`) symlink into `packages/ai/kit/skills`. Edit kit sources there, not through the symlink. | `AGENTS.md:37-41`; `.agents/README.md:5-8` | `packages/ai/tests/unit/repo-wiring.test.ts` | `repo-wiring.test.ts` |
| A-02 | current | Subagent `model` in kit sources is omitted or `inherit`; names match files; descriptions are one line. | `packages/ai/AGENTS.md:12-13`; `packages/ai/src/validate.ts:164` | `packages/ai/tests/unit/` via `validateKit` | `validateKit` |
| A-03 | current | Existing user files are skipped on install; `AGENTS.md` missing the ladder is appended; kit-marked generated agent files are rewritten by `sync`. | `packages/ai/src/install.ts:544-548`; `packages/ai/src/sync.ts:117-121` | `packages/ai/tests/unit/sync.test.ts`; `packages/ai/tests/unit/install.test.ts` | `installKit` / `syncKit` |
| A-04 | current | `zedkit-ai sync` generates `.cursor/agents`, `.claude/agents`, and Muse-native files in `.agents/agents` from unmarked/kit source + `.agents/tokenomics.md`, with a marker on line 2. | `packages/ai/src/sync.ts`; `packages/ai/src/generate.ts` | `packages/ai/tests/unit/sync.test.ts`; `packages/ai/tests/unit/generate-muse-kit.test.ts` | `syncKit` |
| A-05 | current | Muse needs **regular files** in `.agents/agents`. A directory symlink empties its catalog. `sync` converts the kit dir-link and keeps an unmarked alias source beside the Muse dest. | `packages/ai/src/provider-keys.ts`; `packages/ai/src/sync.ts` | `packages/ai/tests/unit/repo-wiring.test.ts`; `packages/ai/tests/unit/sync.test.ts` | `syncKit` + wiring test |
| A-06 | current | Model ids live only in `.agents/tokenomics.md` `providers` cells (and generated provider files that carry the sync marker). Kit agent files stay `inherit`. | `packages/ai/src/tokenomics.ts:232-241`; `packages/ai/kit/agents/explorer.md:4` | `packages/ai/tests/unit/tokenomics.test.ts` | `checkTokenomics` + `validate` hardcode scan |
| A-07 | current | Vendored skills stay verbatim; edits go in `kit/THIRD_PARTY_NOTICES.md`. | `packages/ai/AGENTS.md:21-23` | no test — flag | documented, not enforced (review) |

## Invariants

- One source: `packages/ai/kit/`. Provider layers are generated.
- Never hand-copy kit agent files into `.cursor/agents`; run `sync`.

## Edge cases

| Scenario | Expected behavior |
| -------- | ----------------- |
| `.cursor/agents` is `../.agents/agents` | `sync` unlinks and writes a real directory of generated files |
| User-owned `.cursor/agents/<name>.md` without marker | Kept; generated sidecar `<name>.kit.md` |
| Kit dir-symlink at `.agents/agents` | Converted to Muse-native files; unmarked alias source kept beside the dest |

## Related

`.agents/tokenomics.md`, `packages/ai/AGENTS.md`.
