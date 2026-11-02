---
"@zedtech/zedkit-ui": patch
---

Identity tokens: a CSS value with a control character (a newline in a quoted string, for example) is now refused, because it would drop the declaration that follows it.
