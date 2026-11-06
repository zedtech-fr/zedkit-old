---
"@zedtech/zedkit-ai": minor
---

Stakes on tickets, plans and PRs. A task carries `Stakes: trivial|standard|sensitive|critical` (frontmatter key or line; `standard` when absent), optionally `Kind:` and `Needs:`. New `zedkit-ai stakes <file> [--base <ref>]` prints them with the gates for those stakes and fails when the stakes are lowered against the ref, raised without a `Stakes raised: a -> b: <reason>` line, or `critical` without `Second review:` and `Human validation:` lines. The `plan`, `implement`, `review`, `orchestrate`, `parallel-work` and `definition-of-done` skills set the stakes, route every spawn through `zedkit-ai route` with its kind, and apply the gate; `review` tells a `check` spawn it is read-only and compares `git status --porcelain` before and after, and `sensitive` or higher runs the full lens set.
