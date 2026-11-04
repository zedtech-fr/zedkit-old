---
"@zedtech/zedkit-ai": patch
---

Re-running `setup` (or `init --adopt`) links repo-added skills under `.agents/skills` into a real `.cursor/skills` or `.claude/skills` directory. After a catalog copy in setup-ai phase D, re-run `npx zedkit-ai setup` — never `ln`/`cp` by hand.
