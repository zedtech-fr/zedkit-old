---
"@zedtech/zedkit-ui": minor
---

`OptionCards` can now pick exactly one card: `multiple={false}` renders native radio inputs in a `radiogroup` (round indicator, same visible check) and `onChange` receives `[id]`. `OptionCard` gains `type` (`checkbox` or `radio`) and `name` for custom pick-one groups. The default stays multi-select, so existing callers are unchanged.
