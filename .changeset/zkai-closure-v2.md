---
"@zedtech/zedkit-ai": minor
---

Reference closure v2: validate flags any kit skill/agent named (backticked, Skill-tool, or `/command` form) that the preset does not install, with no false positives on user-authored files. Starter and setup presets gain `parallel-work`, `tdd`, and `adversarial-tests`; optional references in kit files use install-time `<!-- if:skill=x -->` / `if:agent=y` availability blocks (rows removed, sentences dropped) so every preset validates closed. Coverage extends to kit-written root docs (installed `AGENTS.md` template lines and `.agents/personas.md`); the attribution notice is exempt by design.
