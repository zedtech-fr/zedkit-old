/* global URLSearchParams, URL */

/** Query string for catalog filters. Empty means the bare /catalog path. */
export function catalogFilterQuery({ area = "all", status = "all", q = "" } = {}) {
  const params = new URLSearchParams();
  if (area !== "all") params.set("area", area);
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  return params.toString();
}

function pathnameKey(pathname) {
  return pathname.replace(/\/$/, "") || "/";
}

/**
 * Same-document catalog navigation (chip, clear, shared result link).
 * Modified clicks and other paths are left to the browser.
 */
export function catalogClickIsSamePageNavigation(href, pageUrl, { target = "", modifiedClick = false } = {}) {
  if (modifiedClick || (target && target !== "_self")) return false;
  const current = new URL(pageUrl);
  const next = new URL(href, current);
  return next.origin === current.origin && pathnameKey(next.pathname) === pathnameKey(current.pathname);
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

/**
 * Apply URL filters on first load, history, and user same-page navigation.
 * Ignore our own replace echoes so typed letters are not overwritten.
 */
export function shouldApplyCatalogUrl(
  incomingQuery,
  {
    lastPushedQuery = null,
    recentPushedQueries = [],
    fromHistory = false,
    fromUserNavigation = false,
  } = {},
) {
  if (fromHistory || fromUserNavigation || lastPushedQuery === null) return true;
  return !catalogUrlIsOwnReplace(incomingQuery, lastPushedQuery, recentPushedQueries);
}
