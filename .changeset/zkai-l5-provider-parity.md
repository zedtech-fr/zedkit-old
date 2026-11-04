---
"@zedtech/zedkit-ai": minor
---

Provider parity: setup-ai offers cursor, claude, codex and muse with a one-line value each; drift checks cover the claude layer (deleted entries, dangling links) and dangling cursor skill links with non-destructive re-run hints; every preset × provider cell is install-tested in CI. Init into pre-existing real `.claude/` dirs links kit skills in and copies agents/commands (adopt sidecars on collision) instead of dead `zk-*` links.
