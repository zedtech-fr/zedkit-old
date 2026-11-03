import { describe, expect, it } from "vitest";
import {
  ACCESS_ACTIONS,
  collectionAccess,
  globalAccess,
  granted,
  roleOfRequest,
  withGeneratedAccess,
  withGeneratedGlobalAccess,
  type Grant,
} from "#index.js";

const GRANTS: readonly Grant[] = [
  { role: "owner", resource: "collection", name: "*", actions: [...ACCESS_ACTIONS] },
  { role: "owner", resource: "global", name: "*", actions: ["read", "update"] },
  { role: "guest", resource: "collection", name: "media", actions: ["read"] },
  { role: "writer", resource: "collection", name: "posts", actions: ["read", "create", "update"] },
  { role: "reader", resource: "collection", name: "posts", actions: ["read"] },
  { role: "guest", resource: "global", name: "settings", actions: ["read"] },
];

const ctx = (user: unknown) => ({ req: { user } }) as never;

describe("granted", () => {
  it("lets a wildcard role do everything in its resource, including future names", () => {
    for (const action of ACCESS_ACTIONS) {
      expect(granted(GRANTS, "owner", "collection", "anything-new", action)).toBe(true);
    }
  });

  it("matches exact names and actions only", () => {
    expect(granted(GRANTS, "writer", "collection", "posts", "update")).toBe(true);
    expect(granted(GRANTS, "writer", "collection", "posts", "delete")).toBe(false);
    expect(granted(GRANTS, "writer", "collection", "media", "read")).toBe(false);
    expect(granted(GRANTS, "reader", "collection", "posts", "create")).toBe(false);
  });

  it("denies unknown roles and an empty grant list", () => {
    expect(granted(GRANTS, "intruder", "collection", "media", "read")).toBe(false);
    expect(granted([], "owner", "collection", "posts", "read")).toBe(false);
  });

  it("never crosses resources", () => {
    const collectionOnly: Grant[] = [
      { role: "owner", resource: "collection", name: "*", actions: [...ACCESS_ACTIONS] },
    ];
    expect(granted(collectionOnly, "owner", "global", "settings", "read")).toBe(false);
    const named: Grant[] = [{ role: "guest", resource: "collection", name: "media", actions: ["read"] }];
    expect(granted(named, "guest", "global", "media", "read")).toBe(false);
  });

  it("does not treat a wildcard in the requested name as a match-all", () => {
    expect(granted(GRANTS, "reader", "collection", "*", "read")).toBe(false);
  });
});

describe("roleOfRequest", () => {
  it("maps a missing user to the default anonymous role", () => {
    expect(roleOfRequest({ user: null })).toBe("public");
    expect(roleOfRequest({})).toBe("public");
  });

  it("honours a custom anonymous role and role field", () => {
    expect(roleOfRequest({}, { anonymousRole: "guest" })).toBe("guest");
    expect(roleOfRequest({ user: { kind: "owner" } }, { roleField: "kind" })).toBe("owner");
    expect(roleOfRequest({ user: { role: "owner" } }, { roleField: "kind" })).toBeNull();
  });

  it("fails closed on roleless or malformed users", () => {
    expect(roleOfRequest({ user: { id: 1 } })).toBeNull();
    expect(roleOfRequest({ user: { role: 42 } })).toBeNull();
    expect(roleOfRequest({ user: "owner" })).toBeNull();
  });
});

describe("collectionAccess", () => {
  const access = collectionAccess(GRANTS, "posts");

  it("compiles every action to a Payload access function", () => {
    expect(Object.keys(access).sort()).toEqual([...ACCESS_ACTIONS].sort());
  });

  it("allows and denies by the request role", async () => {
    expect(await access.update(ctx({ role: "writer" }))).toBe(true);
    expect(await access.delete(ctx({ role: "writer" }))).toBe(false);
    expect(await access.delete(ctx({ role: "owner" }))).toBe(true);
    expect(await access.read(ctx(null))).toBe(false);
  });

  it("denies authenticated users without a role", async () => {
    expect(await access.read(ctx({ id: 1 }))).toBe(false);
  });

  it("opens the anonymous surface only through the anonymous role", async () => {
    const media = collectionAccess(GRANTS, "media", { anonymousRole: "guest" });
    expect(await media.read(ctx(null))).toBe(true);
    expect(await media.create(ctx(null))).toBe(false);
    expect(await collectionAccess(GRANTS, "media").read(ctx(null))).toBe(false);
  });
});

describe("globalAccess", () => {
  it("exposes read and update only", () => {
    expect(Object.keys(globalAccess(GRANTS, "settings")).sort()).toEqual(["read", "update"]);
  });

  it("compiles global grants", async () => {
    const access = globalAccess(GRANTS, "settings", { anonymousRole: "guest" });
    expect(await access.read(ctx(null))).toBe(true);
    expect(await access.update(ctx(null))).toBe(false);
    expect(await access.update(ctx({ role: "owner" }))).toBe(true);
    expect(await globalAccess(GRANTS, "other", { anonymousRole: "guest" }).read(ctx(null))).toBe(false);
  });
});

describe("withGeneratedAccess", () => {
  it("fills a silent collection and keeps the rest of the config", () => {
    const out = withGeneratedAccess({ slug: "posts", fields: [], labels: { singular: "Post" } }, GRANTS);
    expect(out.access).toBeDefined();
    expect(out.labels).toEqual({ singular: "Post" });
  });

  it("keeps explicit access whole, even partial", () => {
    const input = { slug: "posts", fields: [], access: { read: () => true } };
    const out = withGeneratedAccess(input, GRANTS);
    expect(out).toBe(input);
    expect(out.access).toEqual({ read: input.access.read });
  });

  it("does not mutate its input", () => {
    const input = { slug: "posts", fields: [] };
    withGeneratedAccess(input, GRANTS);
    expect("access" in input).toBe(false);
  });

  it("denies a new collection no grant names", async () => {
    const out = withGeneratedAccess({ slug: "brand-new", fields: [] }, GRANTS.filter((g) => g.role !== "owner"));
    expect(await out.access?.read?.(ctx({ role: "writer" }))).toBe(false);
  });
});

describe("withGeneratedGlobalAccess", () => {
  it("fills a silent global", async () => {
    const out = withGeneratedGlobalAccess({ slug: "settings", fields: [] }, GRANTS, { anonymousRole: "guest" });
    expect(await out.access?.read?.(ctx(null))).toBe(true);
    expect(await out.access?.update?.(ctx(null))).toBe(false);
  });

  it("keeps explicit access whole", () => {
    const input = { slug: "settings", fields: [], access: { read: () => true } };
    expect(withGeneratedGlobalAccess(input, GRANTS)).toBe(input);
  });
});
