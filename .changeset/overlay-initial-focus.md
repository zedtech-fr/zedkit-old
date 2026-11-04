---
"@zedtech/zedkit-ui": patch
---

Drawer and Dialog focus the panel itself on open — never a field, never a text selection — through a shared `focusOverlayInitial` helper. New opt-in `initialFocus` prop (a ref or a selector resolved inside the panel, typed `OverlayInitialFocus`) moves focus to a field with the caret at the end.
