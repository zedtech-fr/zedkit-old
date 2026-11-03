---
"@zedtech/zedkit-ui": patch
---

`identityContrastWarnings` now suggests a foreground that actually meets the target on mid-tone backgrounds: the nudge tries darker and lighter and keeps the smallest passing move, instead of picking one direction from the background luminance and stopping at white or black below the target.
