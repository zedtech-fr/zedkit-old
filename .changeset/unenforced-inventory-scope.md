---
"@zedtech/zedkit-ai": patch
---

`validate --setup` D2 now also requires the Unenforced rules inventory to cite `current (documented, not enforced)` Identity rules in `design.md` (for example `I-04`) and every nested `AGENTS.md` that carries `documented, not enforced` rules. It also catches an unenforced domain rule that is not on the first line of its file (the old check only read the first line). The setup-ai skill adds domain purity to the architecture reconciliation.
