---
"@zedtech/zedkit-ai": minor
---

Add `runGate` and `zedkit-ai gate <log> -- <command>`: run one gate command into a setup-log gate log (`CMD:`, `START:`, output, `END:`, `CAUSE:` on timeout, signal or out-of-memory, `EXIT:<code>` last). Output streams to the file, the V8 heap is capped at 4096 MB unless `NODE_OPTIONS` sets one, and a TERM or INT to the wrapper still closes the log.
