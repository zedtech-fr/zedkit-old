---
"@zedtech/zedkit-ai": patch
---

Setup-log write order: the normal path captures every gate's persisted output first, writes the setup-log entry in one atomic write (no stub grown by appends), and runs `validate --setup` only against the finished file — validation reads whatever is on disk. No checker change: a half-written log is procedural, and no mtime heuristic belongs in the checker.
