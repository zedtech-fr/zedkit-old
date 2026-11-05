---
"@zedtech/zedkit-ai": minor
---

`/setup-ai` v3. Phase B now reads the code first: read-only subagents, one per slice of the repo (1-5 on a small repo, up to 20 on a big one), report the domain, business, identity, architecture and convention rules already in place with `file:line` evidence, and the interview asks only what the code could not answer. The merged rules land in `.agents/domain/`, an identity table in `.agents/design.md`, and a nested `AGENTS.md` per folder that differs. The run routes models by tier (scout reads, worker drafts, lead decides) on the provider it runs on and writes `.agents/model-routing.md` plus a short rule in the generated `AGENTS.md`. New `zedkit-ai scan [dir]` sizes the repo and cuts the slices; `validate --setup` now also fails a setup with no reading log, no domain rules, no nested `AGENTS.md` (or stated reason) or no model routing. The rubric gains depth axes D1-D4.
