---
"@zedtech/zedkit-ui": patch
---

A dark section inside an identity scope now follows the nearest scope even when a deeper scope of another look sits between them. Custom identity values (pasted JSON, shared links) must be a plain CSS value: braces, semicolons, comments, at-rules and `url()` are rejected, and a value is capped at 400 characters. `ScrollScenes` fades scenes with opacity only, so a toast or floating bar inside the visible scene stays anchored to the viewport.
