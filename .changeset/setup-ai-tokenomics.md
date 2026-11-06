---
"@zedtech/zedkit-ai": minor
---

`/setup-ai` now fills `.agents/tokenomics.md` from the tool's model listing and runs `zedkit-ai sync`, instead of writing `.agents/model-routing.md`. `validate --setup` D4 accepts the new file (a real model on at least `build.standard` and `decide.sensitive`, pointed at from `AGENTS.md`). A leftover `model-routing.md` still passes D4 with a deprecation note, and model names in that file are warnings, not errors, until support is removed two minors later.
