---
"@zedtech/zedkit-ai": patch
---

Adopt installs no longer write a `personas.kit.md` sidecar when `.agents/personas.md` already carries the v2 schema headers; the file is kept as already customized, so repeat `setup` runs stay no-ops. Files without v2 headers (v1, hand-written) still get the kit sidecar.
