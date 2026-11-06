---
"@zedtech/zedkit-ai": minor
---

Agents declare `role`, `default_needs` (reasoning and context defaults a call may override) and, where useful, a `kinds` allowlist and a `default_kind` hint, in `agents.meta.json` next to `tokenomics.md` (the kit ships one for its 18 agents). The headers are not in agent frontmatter: at least one supported tool silently skips an agent whose frontmatter has a key it does not know, so `validate` now rejects those keys in an agent file. `kind` is per invocation, never an agent property. `validate` rejects `needs` and `kind` in an entry, requires the write deny list in the agent file when `kinds` has no `build`, and requires an entry for every agent only when `strict_headers: true`. A kit agent without an entry uses the shipped table, so no refresh is needed.
