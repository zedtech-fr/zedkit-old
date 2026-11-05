"use client";

import { useCallback, useState } from "react";
import {
  applyCustomIdentity,
  applyIdentity,
  discardCustomIdentity,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import {
  clearDocsSiteIdentity,
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  isDocsSiteIdentityOptIn,
  setDocsSiteIdentityOptIn,
} from "@/lib/site-identity-storage";

/**
 * Same apply / remove path as the identity editor KeepBar, for the dock Preview and Conversation tabs.
 * Callers pass the tokens to apply (usually the contrast-repaired proposal).
 */
function useDocsSiteIdentityApply() {
  const [appliedSite, setAppliedSite] = useState(() =>
    typeof window === "undefined" ? false : isDocsSiteIdentityOptIn(),
  );

  const applySite = useCallback((tokens: IdentityTokens) => {
    setDocsSiteIdentityOptIn(true);
    applyCustomIdentity(tokens, DOCS_SITE_IDENTITY_STORAGE_KEY);
    setAppliedSite(true);
  }, []);

  const removeFromSite = useCallback(() => {
    clearDocsSiteIdentity();
    discardCustomIdentity(DOCS_SITE_IDENTITY_STORAGE_KEY);
    applyIdentity(DEFAULT_IDENTITY, DOCS_SITE_IDENTITY_STORAGE_KEY);
    setAppliedSite(false);
  }, []);

  return { appliedSite, applySite, removeFromSite };
}

export { useDocsSiteIdentityApply };
