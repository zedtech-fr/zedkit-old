---
"@zedtech/zedkit-ui": patch
---

`PromptInput` gains `sendDisabled`: it blocks sending while the field stays editable, so a draft can be typed (and kept) while the service is off. `disabled` still blocks both.
