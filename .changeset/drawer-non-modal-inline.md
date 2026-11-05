---
"@zedtech/zedkit-ui": patch
---

`Drawer` with `modal={false}` renders a kit inline panel (Surface + portal) instead of Vaul/Radix Dialog, so focus and pointer events reach the page; Escape still closes and focus returns to the trigger.
