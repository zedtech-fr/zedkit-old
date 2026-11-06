# PLAN: zedkit own-install improve (tokenomics + setup depth)

Owner approved in the run prompt (autonomous; no pause). Mode: **improve**. Wired: **cursor, muse**. Design.md landed from the D2 draft after the child exited.

| Tier | Artifact / skill | Path | Why (evidence) | Action | Value (one line) | OK |
| ---- | ---------------- | ---- | -------------- | ------ | ---------------- | --- |
| must | Plan | `.agents/setup-log/plan.md` | validate --setup needs a plan file | create | Coverage of every git path | safe |
| must | Reading log | `.agents/setup-log/reading.md` | D1; `zedkit-ai scan` = medium, 9 readers | create | Code-first rules with file:line | safe |
| must | Product | `.agents/product.md` | gap: missing product summary | create | What this kit sells, from README + owner | safe |
| must | Domain: hygiene | `.agents/domain/public-hygiene.md` | public-repo invariants in AGENTS.md + CI | create | Secrets, tryCatch, imports | safe |
| must | Domain: publishing | `.agents/domain/publishing.md` | changesets + release.yml | create | No laptop npm publish | safe |
| must | Domain: AI kit | `.agents/domain/ai-kit.md` | packages/ai install/sync/validate | create | Own-install wiring without writing kit | safe |
| must | Domain: identity suggest | `.agents/domain/identity-suggest.md` | deploy/suggest money + tokens | create | Operator spend bounds, not customer checkout | safe |
| must | Tokenomics | `.agents/tokenomics.md` | D4; Cursor Task listing | create | Pin Cursor cells; every Muse cell Contributor | safe |
| must | AGENTS ladder/map | `AGENTS.md` | pointer at tokenomics + product/domain | edit | Agents find routing and domain | safe |
| must | Personas v2 | `.agents/personas.md` | existing table kept; add journey tests | edit | Keep author names; add v2 columns | safe |
| must | Setup log | `.agents/setup-log.md` | phase E retro + unenforced inventory | create | Scores, providers, gates | safe |
| must | Nested pointer | `packages/ai/AGENTS.md` | D3 link to `.agents/domain` | edit | Other providers find AI domain | safe |
| must | Nested pointer | `packages/core/AGENTS.md` | D3 link to public-hygiene | edit | tryCatch home points at domain | safe |
| must | Nested pointer | `deploy/AGENTS.md` | D3 link to identity-suggest | edit | Suggest rules find domain file | safe |
| must | Nested pointer | `apps/docs/AGENTS.md` | D3 link to domain | edit | Docs find domain; signature already linked | safe |
| must | Agents README | `.agents/README.md` | point at product/domain/tokenomics | edit | Setup files are discoverable | safe |
| must | Cursor agents | `.cursor/` | `sync --provider cursor,muse` generates `.cursor/agents` | edit (sync generate) | Generated marker + routed model | safe |
| must | Claude agents | `.claude/` | committed follow-link would read Muse files; sync converted it | edit (sync generate) | Claude dialect, not Muse bytes | safe |
| must | Design / identity | `.agents/design.md` | D2; docs UI exists; draft applied | create | Identity rules + Signature from code | safe |
| must | Gate logs | `.agents/setup-log/gates/` | persist hygiene + sync --check | create | CMD/EXIT evidence (`*.log` gitignored) | safe |
| must | Validate log | `.agents/setup-log/validate.log` | final `validate --setup` | create | Named in setup-log | safe |
| must | Kit issue drafts | `.agents/setup-log/kit-issues/` | one draft per friction | create | Public-safe kit follow-ups | safe |
| must | Untracked dist | `packages/ai/dist` | `git status --porcelain -uall` before plan | leave | Build artifact; do not commit | safe |
| should | Catalog skills | `.agents/skills/{add-capability,add-migration,domain-change}` | `.agents/skills` is a kit symlink | leave (deferred) | Installing would write kit sources | safe |
| could | (done) Design / identity | `.agents/design.md` | applied after child exit | create | D2 identity + signature | safe |

## Appendix

| Provider | Value |
| -------- | ----- |
| `cursor` | Rules, skills, agents and commands inside the IDE |
| `claude` | The same setup for Claude Code sessions, linked not copied |
| `codex` | Reads the shared source directly; nothing extra to install |
| `muse` | Native generated files in `.agents/agents` (closed frontmatter, Muse tool names) |

**Wired:** cursor, muse

**Routing:** provider cursor. Model list source: Cursor Task `model` parameter in this session (ids recorded only in `.agents/tokenomics.md` `providers` cells, not in this prose). Cursor and Muse cells use the ids listed in `.agents/tokenomics.md` (Muse is not inherit). Then `node packages/ai/dist/bin.js sync --provider cursor,muse`.

**Reading:** medium repo (1696 files), 9 readers from `node packages/ai/dist/bin.js scan` (slices: packages, apps, scripts, registry, deploy, .changeset, `.`, docs, `.github` + `.changeset-hold`). Readers as `check`/`standard` on the Cursor check cell. Synthesis as `decide`/`sensitive` on the parent. Log: `.agents/setup-log/reading.md`.

**Intro-first:** intro-first: printed before any tool call (improve)

**Non-goals (source: owner):** no Version PR, no npm publish, no docs-e2e from this checkout.
