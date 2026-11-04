---
"@zedtech/zedkit-ui": patch
---

Fix drawer/dialog rendering under the sticky site header: add a z-index token scale (`--z-header` < `--z-dropdown` < `--z-overlay` < `--z-drawer`/`--z-dialog` < `--z-toast`, with `z-*` Tailwind utilities), mount dialog/drawer portals to `document.body` with a scope-look mirror so no consumer stacking context can trap them, and mount dropdown panels opened inside an overlay into that panel.
