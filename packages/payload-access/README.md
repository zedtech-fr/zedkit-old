# @zedtech/zedkit-payload-access

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-payload-access.svg)](https://www.npmjs.com/package/@zedtech/zedkit-payload-access)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

Role grants declared as plain data, compiled to Payload access
functions. Default-deny: anything no grant names is refused. Original
work by the same author.

## Install

```sh
pnpm add @zedtech/zedkit-payload-access
```

`payload` is a peer dependency (types only).

## Usage

```ts
import {
  collectionAccess,
  withGeneratedAccess,
  withGeneratedGlobalAccess,
  type Grant,
} from "@zedtech/zedkit-payload-access";

// You own the roles and the grants. Nothing is built in.
const GRANTS: readonly Grant[] = [
  { role: "admin", resource: "collection", name: "*", actions: ["read", "create", "update", "delete"] },
  { role: "admin", resource: "global", name: "*", actions: ["read", "update"] },
  { role: "editor", resource: "collection", name: "posts", actions: ["read", "create", "update"] },
  { role: "public", resource: "collection", name: "posts", actions: ["read"] },
];

// One collection by hand:
export const Posts = { slug: "posts", fields: [], access: collectionAccess(GRANTS, "posts") };

// Or fill every collection and global that declares no access:
const collections = rawCollections.map((c) => withGeneratedAccess(c, GRANTS));
const globals = rawGlobals.map((g) => withGeneratedGlobalAccess(g, GRANTS));
```

## Rules

- **Default-deny.** A request is allowed only when a grant matches its
  role, resource (`collection` or `global`), name and action.
- **Resource-scoped.** A collection grant never opens a same-named global.
- **`"*"` name** matches every name in its resource, including ones
  added later.
- **Anonymous requests** use the role `"public"`. Pass
  `{ anonymousRole: "guest" }` to use another name.
- **The user role** is read from `req.user.role`. Pass
  `{ roleField: "kind" }` to read another property. A signed-in user
  without a string role matches nothing.
- **Explicit access wins.** `withGeneratedAccess` and
  `withGeneratedGlobalAccess` leave a config alone when it already has
  an `access` object, even a partial one.
- **Globals** only get `read` and `update`.

## When not to use

For ownership, field-level or locale rules, write Payload access
functions directly. Grants only answer "may this role do this action on
this collection or global".
