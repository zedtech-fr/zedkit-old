---
"@zedtech/zedkit-ai": patch
---

Adopt installs no longer write a `personas.kit.md` sidecar when `.agents/personas.md` was already rewritten from the template (v2 schema headers, or a reshaped table); the file is kept as already customized, so repeat `setup` runs stay no-ops.
