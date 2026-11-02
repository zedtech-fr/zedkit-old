/** @typedef {{ id: string; url: string; type?: string; content?: string; breadcrumbs?: string[] }} SearchLike */

/** @typedef {{ href: string; label: string }} CanonicalEntry */

/**
 * @param {string} url
 * @returns {string}
 */
export function pagePathFromUrl(url) {
  if (typeof url !== "string" || url.length === 0) return "";
  const hash = url.indexOf("#");
  return hash === -1 ? url : url.slice(0, hash);
}

/**
 * @param {string} query
 */
export function normalizeSearchQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * @param {string} text
 */
export function compactSearchText(text) {
  return normalizeSearchQuery(text).replace(/\s+/g, "");
}

/**
 * @param {Record<string, CanonicalEntry>} canonicalByHref
 */
export function buildCanonicalQueryIndex(canonicalByHref) {
  /** @type {Map<string, CanonicalEntry>} */
  const byQuery = new Map();
  for (const entry of Object.values(canonicalByHref)) {
    byQuery.set(compactSearchText(entry.label), entry);
    const spaced = entry.label.replace(/([a-z])([A-Z])/g, "$1 $2");
    byQuery.set(compactSearchText(spaced), entry);
    byQuery.set(normalizeSearchQuery(entry.label), entry);
    byQuery.set(normalizeSearchQuery(spaced), entry);
  }
  return byQuery;
}

/**
 * @param {SearchLike} record
 * @param {string} query
 * @param {Map<string, CanonicalEntry>} canonicalByQuery
 * @param {Record<string, CanonicalEntry>} canonicalByHref
 * @returns {0 | 1 | 2}
 */
export function rankTierForRecord(record, query, canonicalByQuery, canonicalByHref) {
  const normalized = normalizeSearchQuery(query);
  const compact = compactSearchText(query);
  if (!normalized) return 2;

  const path = pagePathFromUrl(record.url);
  const canonical = canonicalByHref[path];
  if (canonical) {
    if (canonicalByQuery.get(compact)?.href === path || canonicalByQuery.get(normalized)?.href === path) {
      return 0;
    }
    const labelCompact = compactSearchText(canonical.label);
    const labelSpaced = compactSearchText(canonical.label.replace(/([a-z])([A-Z])/g, "$1 $2"));
    if (
      labelCompact.startsWith(compact) ||
      labelSpaced.startsWith(compact) ||
      normalizeSearchQuery(canonical.label).startsWith(normalized)
    ) {
      return 1;
    }
  }

  const text = typeof record.content === "string" ? record.content : "";
  const plain = normalizeSearchQuery(text.replace(/[#*`[\]]/g, " "));
  if (plain === normalized || plain.startsWith(normalized)) return 1;
  return 2;
}

/**
 * @param {readonly SearchLike[]} items
 */
export function splitSearchItemGroups(items) {
  /** @type {SearchLike[][]} */
  const groups = [];
  /** @type {SearchLike[] | null} */
  let current = null;
  for (const item of items) {
    if (item.type === "page" || item.type === "table") {
      current = [item];
      groups.push(current);
      continue;
    }
    if (!current) {
      current = [item];
      groups.push(current);
      continue;
    }
    current.push(item);
  }
  return groups;
}

/**
 * @param {SearchLike} record
 * @param {Record<string, CanonicalEntry>} canonicalByHref
 */
export function withCanonicalPageLabel(record, canonicalByHref) {
  if (record.type !== "page") return record;
  const canonical = canonicalByHref[pagePathFromUrl(record.url)];
  if (!canonical) return record;
  const labeled = { ...record, content: canonical.label };
  delete labeled.hastContent;
  return labeled;
}

/**
 * @param {string} query
 * @param {Record<string, CanonicalEntry>} canonicalByHref
 * @returns {CanonicalEntry | null}
 */
export function findCanonicalForQuery(query, canonicalByHref) {
  const compact = compactSearchText(query);
  const normalized = normalizeSearchQuery(query);
  if (!compact) return null;
  const byQuery = buildCanonicalQueryIndex(canonicalByHref);
  const exact = byQuery.get(compact) ?? byQuery.get(normalized);
  if (exact) return exact;

  /** @type {CanonicalEntry | null} */
  let best = null;
  let bestLen = Number.POSITIVE_INFINITY;
  for (const entry of Object.values(canonicalByHref)) {
    const labelCompact = compactSearchText(entry.label);
    const labelSpaced = compactSearchText(entry.label.replace(/([a-z])([A-Z])/g, "$1 $2"));
    if (!labelCompact.startsWith(compact) && !labelSpaced.startsWith(compact)) continue;
    const len = Math.min(labelCompact.length, labelSpaced.length);
    if (len < bestLen) {
      best = entry;
      bestLen = len;
    }
  }
  return best;
}

/**
 * @param {CanonicalEntry} entry
 * @returns {SearchLike}
 */
function syntheticCanonicalPage(entry) {
  return {
    id: entry.href,
    type: "page",
    url: entry.href,
    content: entry.label,
    breadcrumbs: ["Docs", "UI"],
  };
}

/**
 * @param {readonly SearchLike[]} items
 * @param {string} query
 * @param {Record<string, CanonicalEntry>} canonicalByHref
 */
export function rankAndGroupSearchItems(items, query, canonicalByHref) {
  if (!query.trim()) return [...items];

  const canonical = findCanonicalForQuery(query, canonicalByHref);
  let list = items.filter((item) => typeof item.url === "string" && item.url.length > 0);
  if (canonical && !list.some((item) => item.type === "page" && pagePathFromUrl(item.url) === canonical.href)) {
    list = [syntheticCanonicalPage(canonical), ...list];
  }

  const canonicalByQuery = buildCanonicalQueryIndex(canonicalByHref);
  const groups = splitSearchItemGroups(list);
  const seenPaths = new Set();

  const ranked = groups
    .map((group, index) => {
      const page = group.find((item) => item.type === "page") ?? group[0];
      const path = pagePathFromUrl(page.url);
      const tier = rankTierForRecord(page, query, canonicalByQuery, canonicalByHref);
      return { group, index, path, tier };
    })
    .filter(({ path, group }) => {
      if (!path) return false;
      const page = group.find((item) => item.type === "page");
      if (!page) return true;
      if (seenPaths.has(path)) return false;
      seenPaths.add(path);
      return true;
    })
    .sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.index - b.index));

  return ranked.flatMap(({ group }) =>
    group.map((item) => withCanonicalPageLabel(item, canonicalByHref)),
  );
}
