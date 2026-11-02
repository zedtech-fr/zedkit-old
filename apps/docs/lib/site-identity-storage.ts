/** Persists the docs site look only after explicit opt-in from the identity editor. */
const DOCS_SITE_IDENTITY_STORAGE_KEY = "zk-docs-site-identity";

/** Set to `"1"` when the visitor chose Apply to the whole site. */
const DOCS_SITE_IDENTITY_OPT_IN_KEY = "zk-docs-site-identity-opt-in";

const LEGACY_IDENTITY_KEYS = ["zk-identity", "zk-identity-custom"] as const;

function docsSiteCustomStorageKey(): string {
  return `${DOCS_SITE_IDENTITY_STORAGE_KEY}-custom`;
}

function isDocsSiteIdentityOptIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DOCS_SITE_IDENTITY_OPT_IN_KEY) === "1";
}

function setDocsSiteIdentityOptIn(enabled: boolean): void {
  if (enabled) {
    window.localStorage.setItem(DOCS_SITE_IDENTITY_OPT_IN_KEY, "1");
    return;
  }
  window.localStorage.removeItem(DOCS_SITE_IDENTITY_OPT_IN_KEY);
}

/** Drop keys that used to drive the whole site without explicit opt-in. */
function purgeLegacyIdentityStorage(): void {
  for (const key of LEGACY_IDENTITY_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function clearDocsSiteIdentity(): void {
  setDocsSiteIdentityOptIn(false);
  window.localStorage.removeItem(DOCS_SITE_IDENTITY_STORAGE_KEY);
  window.localStorage.removeItem(docsSiteCustomStorageKey());
}

export {
  DOCS_SITE_IDENTITY_OPT_IN_KEY,
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  LEGACY_IDENTITY_KEYS,
  clearDocsSiteIdentity,
  docsSiteCustomStorageKey,
  isDocsSiteIdentityOptIn,
  purgeLegacyIdentityStorage,
  setDocsSiteIdentityOptIn,
};
