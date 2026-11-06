---
"@zedtech/zedkit-ai": minor
---

New `zedkit-ai sync` and `syncKit`: write each tool's agent files from `.agents/agents` and `.agents/tokenomics.md`. `.cursor/agents` and `.claude/agents` get one generated copy per agent with `model` set from the route of the agent's default kind at `standard` stakes and a marker comment on line 2; Codex and Muse read `.agents/agents` directly and get a note. A marked file is regenerated, a plain copy of the source is replaced, any other file is kept with the generated version beside it as `<name>.kit.md`, and a source that pins a `model` keeps it. `--check` exits 1 when a file is out of date, `--dry-run` writes nothing, orphaned generated files are pruned (`--no-prune` keeps them; `--prune` with `--provider` also removes the files of a provider left out), and a `.claude/agents` link made by `init` becomes a real directory. `init` and `setup` do not use it yet. `Action.kind` gains `generate`, `convert` and `prune`.
