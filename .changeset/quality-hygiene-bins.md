---
"@zedtech/zedkit-quality": minor
---

Ship `zedkit-sync-env`, `zedkit-check-no-artifacts`, and `zedkit-check-no-secrets` as package bins. Artifact dirs/files/allowlist are parameterized (`--dirs` / `--files` / `--allow`); the ignore check uses `--no-index` so ignored-but-tracked files fail. Existing eslint/tsconfig exports are unchanged.
