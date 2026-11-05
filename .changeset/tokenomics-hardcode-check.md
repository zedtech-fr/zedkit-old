---
"@zedtech/zedkit-ai": minor
---

`validate` now fails on a model name written outside `.agents/tokenomics.md`. It scans skills, subagents, commands, top-level `.agents/*.md`, root `AGENTS.md` / `CLAUDE.md` and Cursor rules for id-shaped names (`claude-…`, `gpt-…`, `gemini-…`, `sonnet 4`, and so on), for every id-shaped model your cells pin, and for your own `hardcode.extra_patterns`. Keep a name on purpose with `<!-- zk:model-ok -->` on the same line or the line above, or list the file under `hardcode.allow_paths`. The legacy `.agents/model-routing.md` is not scanned. A command with a `model:` other than `inherit` is now an error, like a subagent.
