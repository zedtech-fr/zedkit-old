# Catalog — @zedtech/zedkit-payload-access

- Keywords: payloadcms, payload, access-control, rbac, permissions, roles, cms, typescript
- Audience: Payload CMS developers who want role permissions declared as data.
- Purpose: Default-deny role grants compiled to Payload access functions for collections and globals.


## Control who can read and write Payload collections and globals

- Import: `@zedtech/zedkit-payload-access` — `granted`, `roleOfRequest`, `collectionAccess`, `globalAccess`, `withGeneratedAccess`, `withGeneratedGlobalAccess`, `Grant`, `AccessAction`, `ResourceTarget`, `RoleOptions`, `ACCESS_ACTIONS`, `GLOBAL_ACTIONS`, `ALL_NAMES`, `PUBLIC_ROLE`
- Wraps: `payload` (peer, types only)
- Status: alpha
- Short name: Role grants
- Audience: Payload CMS developers who want role permissions declared as data.
- Purpose: Turn a list of role grants into Payload access functions, default-deny, with no roles built in.
- When to use: When several roles share one Payload app and new collections must stay closed until someone grants them.
- When not to use: For ownership, field-level or locale rules — write Payload access functions directly.

```ts
import { withGeneratedAccess, type Grant } from "@zedtech/zedkit-payload-access";
const grants: Grant[] = [{ role: "editor", resource: "collection", name: "posts", actions: ["read", "update"] }];
const posts = withGeneratedAccess({ slug: "posts", fields: [] }, grants);
// posts.access: editors read/update, everyone else denied
const anonymous = { anonymousRole: "guest" }; // optional: rename the signed-out role
```
