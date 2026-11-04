---
"@zedtech/zedkit-ai": patch
---

Gate inventory completeness: the setup-log template requires one Gate outcomes row per persisted gate log file (named, killed logs included), and `validate --setup` issues when a file in `.agents/setup-log/gates/` has no mention in `.agents/setup-log.md`.
