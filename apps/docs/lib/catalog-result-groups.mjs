/** @typedef {import("../content/catalog-index").CatalogIndexEntry} CatalogIndexEntry */

/** @typedef {{ id: string; label: string; entries: CatalogIndexEntry[] }} CatalogResultGroup */

const GROUP_DEFS = [
  { id: "ui", label: "UI", area: "ui" },
  { id: "backend", label: "Core & server", area: "backend" },
  { id: "seo", label: "SEO", area: "seo" },
  { id: "agents", label: "Agents", area: "agents" },
];

const areaToGroup = new Map(GROUP_DEFS.map((group) => [group.area, group.id]));

/** @type {ReadonlySet<string>} */
const KNOWN_AREAS = new Set(GROUP_DEFS.map((group) => group.area));

/** @param {CatalogIndexEntry[]} entries */
export function groupCatalogResults(entries) {
  /** @type {Map<string, CatalogIndexEntry[]>} */
  const buckets = new Map();
  for (const entry of entries) {
    if (!KNOWN_AREAS.has(entry.area)) {
      throw new Error(`catalog results: unmapped catalog area "${entry.area}" (${entry.href})`);
    }
    const id = areaToGroup.get(entry.area);
    if (!id) {
      throw new Error(`catalog results: no result group for area "${entry.area}" (${entry.href})`);
    }
    const list = buckets.get(id) ?? [];
    list.push(entry);
    buckets.set(id, list);
  }
  return GROUP_DEFS.filter((def) => (buckets.get(def.id)?.length ?? 0) > 0).map((def) => {
    const entries = buckets.get(def.id);
    return { id: def.id, label: def.label, entries: entries ?? [] };
  });
}
