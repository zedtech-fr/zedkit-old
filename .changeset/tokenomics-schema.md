---
"@zedtech/zedkit-ai": minor
---

Add `.agents/tokenomics.md`: one policy file that maps kind (`decide`, `design`, `build`, `check`) times stakes (`trivial`, `standard`, `sensitive`, `critical`) to a model and effort per provider, plus review gates per stakes. The full default policy ships in the package and is read at run time; `init` and `setup` install a short stub and never overwrite it. `validate` checks the file when present: schema, unknown keys, all 16 cells per provider, gate floors, and no model name outside `providers`.
