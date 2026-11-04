---
"@zedtech/zedkit-ui": patch
---

Declare `@zedtech/zedkit-core` as a runtime dependency: the overlay initial-focus helper imports it, so installs of the package alone failed to resolve it.
