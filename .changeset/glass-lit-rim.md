---
"@zedtech/zedkit-ui": minor
---

Glass look: a clearer fill with a slanted sheen, a lit rim (bright top-left edge, soft bottom-right edge, inner glow) carried by `--zk-glass-highlight` and so by every `--zk-shadow-*` consumer, blur lifted by `saturate` and a new `--zk-glass-brightness`, and stronger colour halos behind the glass. New tokens: `--zk-glass-sheen`, `--zk-glass-brightness`. `--zk-glass-alpha` is lower (0.54 light, 0.5 dark) and still overridable; reduced transparency, no `backdrop-filter` and forced colors stay solid. Cards that bring their own wash keep it.
