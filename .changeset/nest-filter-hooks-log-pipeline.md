---
"@zedtech/zedkit-nest": minor
---

Add protected extension points on `AllExceptionsFilter` (`toStatusBody`, `unknownBodyParseError`, `formatBody`) whose defaults match today's bodies, plus optional `LoggerOptions.serializers`, `customLogLevel`, and `transformLine` (unset = today's logger). New helpers `compactRequestSerializers` and `createRequestLogLevel({ quietPaths })`. String-response HttpException 400/413/415 still echo driver text unless a subclass sets `sanitizeStringHttpExceptions` (opt-in).
