---
"@zedtech/zedkit-ui": patch
---

The nearest identity scope owns a plain `.dark` section: inside a scope of another look, an outer scope's dark rule no longer wins by file order (Tide → Press → dark used to resolve to Tide). `ScrollScenes` fades scenes with opacity only: an animated `translate` made the scene the containing block of its `position: fixed` content, so a toast inside it was laid out against the scene. `parseIdentityTokens` now rejects values that could leave their declaration (braces, semicolons, comments, at-rules, `url()`), which matters because recipes arrive from pasted JSON and shared links.
