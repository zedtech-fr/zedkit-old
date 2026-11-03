---
"@zedtech/zedkit-ui": patch
---

`isNamedIdentityId` accepts only `n-` and a plain slug (`a-z`, `0-9`, `-`, up to 120 characters), because the id is written into a `[data-identity="…"]` selector. A saved look whose id could leave that selector is no longer applied.
