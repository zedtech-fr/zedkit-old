---
"@zedtech/zedkit-ui": patch
---

Fix abrupt dialog/drawer close: the portals now use a Presence-free `createPortal` mount, so the overlay and panel inner Presences own the exit lifecycle again (closed state, exit animation, unmount on animation end, instant close under reduced motion).
