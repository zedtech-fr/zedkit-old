---
"@zedtech/zedkit-server": minor
---

`redactValue` accepts a third `options` argument with `valuePatterns` (extra `{ pattern, replacement }` credential shapes, applied before the bearer/basic pattern). `pgErrorCode` (and so `pgErrorRetryable`) also reads the code from `error.cause` one level down, which ORM-wrapped driver errors need. `new MemoryRateLimiter({ windowMs?, now?, maxKeys? })` is optional; the defaults match the previous behavior. The only result that changes: `pgErrorCode` now returns the code for wrapped errors that returned `null` before.
