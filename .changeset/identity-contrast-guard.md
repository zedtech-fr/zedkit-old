---
"@zedtech/zedkit-ui": minor
---

**POTENTIALLY BREAKING:** `IdentityTokens` light/dark pairs now include `primaryForeground` and `mutedForeground`. JSON exports emit them in CSS; older saved JSON without those keys still parses (both default to `foreground`). Contrast warnings cover primary and muted text pairs; `identityContrastTokenLabel` labels them in UI.
