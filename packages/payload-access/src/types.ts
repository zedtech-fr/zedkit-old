/** CRUD actions Payload guards per collection. */
export type AccessAction = "read" | "create" | "update" | "delete";

/** Every collection action, in Payload's order. */
export const ACCESS_ACTIONS: readonly AccessAction[] = ["read", "create", "update", "delete"];

/** Globals are singletons: only read/update exist on them. */
export const GLOBAL_ACTIONS = ["read", "update"] as const;

/**
 * Default pseudo-role for unauthenticated requests (`req.user` missing).
 * Override it with the `anonymousRole` option when your grants use
 * another name.
 */
export const PUBLIC_ROLE = "public";

/** Matches every name within its resource, including ones added later. */
export const ALL_NAMES = "*";

/**
 * What a grant targets: a Payload collection or a global. The matcher
 * never crosses resources, so a collection grant cannot open a
 * same-named global.
 */
export type ResourceTarget = "collection" | "global";

/**
 * One capability: `role` may perform `actions` on `name` in `resource`
 * (`"*"` = all names in that resource). Grants only ever open; anything
 * ungranted is denied. Roles are plain strings you define.
 */
export type Grant = {
  role: string;
  resource: ResourceTarget;
  name: string;
  actions: readonly AccessAction[];
};

/** Knobs for reading the role off a request. */
export type RoleOptions = {
  /** Role used when the request has no user. Default `"public"`. */
  anonymousRole?: string;
  /** Property of `req.user` that holds the role string. Default `"role"`. */
  roleField?: string;
};
