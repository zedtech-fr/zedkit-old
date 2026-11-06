/* global URLSearchParams */

/** Query string for catalog filters. Empty means the bare /catalog path. */
export function catalogFilterQuery({ area = "all", status = "all", q = "" } = {}) {
  const params = new URLSearchParams();
  if (area !== "all") params.set("area", area);
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  return params.toString();
}

/**
 * True when `incomingQuery` is the Next router catching up to our own
 * `replace` (latest or an earlier in-flight one). False for back/forward,
 * a shared link, or an address-bar edit.
 */
export function catalogUrlIsOwnReplace(incomingQuery, lastPushedQuery, recentPushedQueries = []) {
  if (incomingQuery === lastPushedQuery) return true;
  return recentPushedQueries.includes(incomingQuery);
}

/** Apply URL filters on first load, history, and foreign links; ignore our own replace echoes. */
export function shouldApplyCatalogUrl(
  incomingQuery,
  { lastPushedQuery = null, recentPushedQueries = [], fromHistory = false } = {},
) {
  if (fromHistory || lastPushedQuery === null) return true;
  return !catalogUrlIsOwnReplace(incomingQuery, lastPushedQuery, recentPushedQueries);
}
