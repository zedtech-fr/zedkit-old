---
"@zedtech/zedkit-ui": patch
---

Glass identity: sticky headers are translucent frosted glass. New `--zk-glass-bar-*` tokens (alpha, filter, luminous bottom edge, inset relief highlights; no drop shadow) style `MarketingHeader`, with a near-solid fallback when backdrop-filter is unsupported or less transparency is requested.

`PageHeader` takes a `back` slot above the title, spaced by the new `--spacing-page-header-back-gap` token.

`Badge` gains a `meta` variant: caption-size muted mono label with tabular numerals and no surface, for versions and counts.
