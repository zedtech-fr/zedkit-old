---
"@zedtech/zedkit-ai": patch
---

`zedkit-ai scan` now prints the `prettier:` hint (kit paths missing from `.prettierignore`) so the run sees it in phase A, before planning — not after. `validate --setup` requires the `.prettierignore` plan row whenever the hint fires.
