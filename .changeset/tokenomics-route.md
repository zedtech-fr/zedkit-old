---
"@zedtech/zedkit-ai": minor
---

Add `resolveRoute` and `zedkit-ai route <agent> --stakes <s> [--kind decide|design|build|check] [--reasoning ...] [--context ...] [--provider ...] [--json]`: resolve one agent call to a model and effort from `.agents/tokenomics.md` (kind x stakes, shifted one stakes column right for high reasoning or large context, effort lowered one step for low reasoning on trivial and standard tasks). The result carries the gates of the task's stakes, read-only for `check`, the context window, where each need came from, and the second review route for `critical`.
