---
"@zedtech/zedkit-ai": minor
---

`setup-ai` now checks what each extracted rule says, not only that its citation exists: a second reader opens the cited function or transaction and returns match, partial or mismatch (every order, atomicity or timing rule is checked, never sampled). The reading log gains a `## Meaning check` section and `validate --setup` fails on an unchecked sequencing rule or an unresolved mismatch.
