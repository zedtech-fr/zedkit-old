---
"@zedtech/zedkit-ai": patch
---

setup-ai product output now recommends unit and integration tests as primary, contract/Pact when a boundary earns them, and E2E/browser only for an explicitly justified critical user path. Observed CI is recorded, not copied as the desired strategy, and existing CI is left alone unless the owner asked.
