---
"@zedtech/zedkit-ui": patch
---

New reusable `data-surface="glass"` panel surface: a solid popover panel in every identity, frosted under the glass identity with the same overlay tokens as drawer/dialog panels (tinted wash, 24px blur with saturate, soft shadow, translucent edge; light and dark). Near-solid `@supports` fallback when `backdrop-filter` is unavailable, opaque under forced colors.
