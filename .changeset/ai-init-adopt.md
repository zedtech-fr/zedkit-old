---
"@zedtech/zedkit-ai": minor
---

`init --adopt` keeps colliding user files and writes the kit version beside them; a second run skips copies that already match the kit. Validate ignores `*.kit.md` sidecars, reports drift without asking to overwrite, ignores host `/ask` and `/improve`, filters `lenses.md` so uninstalled runners are `planned`, and links kit skills into a real `.cursor/skills` directory.
