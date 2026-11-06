---
"@zedtech/zedkit-ai": patch
---

The setup-ai skill now refreshes the reading log's Rule map after phase C: pointer cells written in phase B are checked against the nested `AGENTS.md` files that now exist (`test -e`, and the file names the rule file), moved or missing pointers are fixed, and a `rule-map: refreshed after phase C` line plus a phase E checklist item record it.
