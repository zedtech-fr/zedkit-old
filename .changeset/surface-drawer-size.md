---
"@zedtech/zedkit-ui": minor
---

Add `Surface`, `surfaceVariants`, `surfaceGlassPanelClass`, and `applySurfaceGlassPanel` as the shared panel chrome (solid, popover, and glass via `data-surface="glass"`; elevation 0–3; radius and padding tokens). `Card`, `Dialog`, `Popover`, `Drawer`, and `WidgetButton` compose it. `DrawerContent` accepts `size="sm" | "md" | "lg"` (`lg` about min(600px, 92vw) on desktop). The docs site applies glass panels through the kit helpers instead of site CSS overrides.
