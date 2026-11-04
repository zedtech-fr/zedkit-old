---
"@zedtech/zedkit-ui": patch
---

Glass identity: sticky headers are translucent frosted glass. New `--zk-glass-bar-*` tokens (alpha, filter, luminous bottom edge, soft shadow) style `MarketingHeader`, with a near-solid fallback when backdrop-filter is unsupported or less transparency is requested.

`PageHeader` takes a `back` slot above the title, spaced by the new `--spacing-page-header-back-gap` token.
