---
"@zedtech/zedkit-ai": minor
---

`validate --setup` now asks for proofs, not claims: a repo with a `check` script must have that full gate persisted as a gate log (`CMD:` first, `EXIT:` last, any exit code) or a Gate outcomes row saying why it did not run. A persisted `.agents/setup-log/validate.log` must come from a clean run and be named in the setup-log. `setup-ai` teaches both.
