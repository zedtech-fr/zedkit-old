import type { Access, CollectionConfig, GlobalConfig } from "payload";
import {
  ACCESS_ACTIONS,
  ALL_NAMES,
  GLOBAL_ACTIONS,
  PUBLIC_ROLE,
  type AccessAction,
  type Grant,
  type ResourceTarget,
  type RoleOptions,
} from "./types.js";

/**
 * Pure matcher: is (role, resource, name, action) granted?
 * Default-deny and resource-scoped: a grant only matches its own
 * resource, so collection grants never open globals.
 */
export function granted(
  grants: readonly Grant[],
  role: string,
  resource: ResourceTarget,
  name: string,
  action: AccessAction,
): boolean {
  return grants.some(
    (grant) =>
      grant.role === role &&
      grant.resource === resource &&
      (grant.name === name || grant.name === ALL_NAMES) &&
      grant.actions.includes(action),
  );
}

/**
 * Role of a request: the user's role, or the anonymous role when there
 * is no user. An authenticated user without a string role matches
 * nothing (`null`): fail closed, never Payload's "any user" default.
 */
export function roleOfRequest(req: { user?: unknown }, options: RoleOptions = {}): string | null {
  const user = req.user;
  if (user === null || user === undefined) {
    return options.anonymousRole ?? PUBLIC_ROLE;
  }
  if (typeof user !== "object") {
    return null;
  }
  const role = (user as Record<string, unknown>)[options.roleField ?? "role"];
  return typeof role === "string" ? role : null;
}

function check(
  grants: readonly Grant[],
  resource: ResourceTarget,
  name: string,
  action: AccessAction,
  options: RoleOptions,
): Access {
  return ({ req }) => {
    const role = roleOfRequest(req, options);
    return role === null ? false : granted(grants, role, resource, name, action);
  };
}

/** Payload access functions for one collection, compiled from grants. */
export function collectionAccess(
  grants: readonly Grant[],
  collection: string,
  options: RoleOptions = {},
): Record<AccessAction, Access> {
  return Object.fromEntries(
    ACCESS_ACTIONS.map((action) => [action, check(grants, "collection", collection, action, options)]),
  ) as Record<AccessAction, Access>;
}

/**
 * Payload access functions for one global, compiled from grants.
 * Read/update only: globals are singletons, create/delete do not
 * exist on them.
 */
export function globalAccess(
  grants: readonly Grant[],
  globalSlug: string,
  options: RoleOptions = {},
): Record<(typeof GLOBAL_ACTIONS)[number], Access> {
  return Object.fromEntries(
    GLOBAL_ACTIONS.map((action) => [action, check(grants, "global", globalSlug, action, options)]),
  ) as Record<(typeof GLOBAL_ACTIONS)[number], Access>;
}

/**
 * Fills a collection's access from grants when it declares none.
 * Explicit access always wins whole (a config that sets even one
 * operation keeps full control); the generator only covers silent
 * collections, which is the default-deny-for-new-collections rule.
 */
export function withGeneratedAccess(
  collection: CollectionConfig,
  grants: readonly Grant[],
  options: RoleOptions = {},
): CollectionConfig {
  if (collection.access) {
    return collection;
  }
  return { ...collection, access: collectionAccess(grants, collection.slug, options) };
}

/**
 * Fills a global's access from grants when it declares none. Same rule
 * as collections: silent globals deny by default until a
 * `resource: "global"` grant names them.
 */
export function withGeneratedGlobalAccess(
  global: GlobalConfig,
  grants: readonly Grant[],
  options: RoleOptions = {},
): GlobalConfig {
  if (global.access) {
    return global;
  }
  return { ...global, access: globalAccess(grants, global.slug, options) };
}
