---
"@zedtech/zedkit-ai": patch
---

Adopt sidecars no longer duplicate live skill names: a fresh `zk-<name>` sidecar carries `name: zk-<name>`, re-running `setup` migrates sidecars an older adopt left behind (user files untouched), and `validate` fails duplicate skill names with the fix.
