---
"@zedtech/zedkit-ai": patch
---

`validate --setup` D1 now requires a `**Budget:**` line in `.agents/setup-log/reading.md`: the run states the repo's read budget (or `none found`), and the only allowed overrun is an owner-approved exception line. The setup-ai skill and reader brief say the same: batch smaller and read entry points first rather than exceed the budget.
