"use client";

import { applyIdentity, CUSTOM_IDENTITY_ID, IDENTITY_CHANGE_EVENT, IDENTITY_STORAGE_KEY } from "./identity.js";
import { applyCustomIdentityCss } from "./identity-custom-sheet.js";
import { isNamedIdentityId } from "./identity-data.js";
import { isPresetId, parseIdentityTokens, tokensToCss, type IdentityTokens } from "./identity-tokens.js";

/**
 * Applies compact tokens to the whole page.
 * Second arg is a look id (preset or `n-…` named id) or a localStorage key.
 * A look id writes CSS under `:root[data-identity="…"]` and keeps that id;
 * any other string is the storage key and activates `custom`.
 */
function applyCustomIdentity(
  tokens: IdentityTokens,
  lookOrKey: string = IDENTITY_STORAGE_KEY,
  persistKey: string = IDENTITY_STORAGE_KEY,
): boolean {
  const parsed = parseIdentityTokens(tokens);
  if (!parsed.success) return false;
  const look = isPresetId(lookOrKey) || isNamedIdentityId(lookOrKey) ? lookOrKey : undefined;
  const key = look ? persistKey : lookOrKey;
  const selector = `:root[data-identity="${look ?? CUSTOM_IDENTITY_ID}"]`;
  applyCustomIdentityCss(tokensToCss(parsed.data, selector), key);
  if (!look) {
    applyIdentity(CUSTOM_IDENTITY_ID, key);
    return true;
  }
  document.documentElement.setAttribute("data-identity", look);
  window.localStorage.setItem(key, look);
  window.dispatchEvent(new Event(IDENTITY_CHANGE_EVENT));
  return true;
}

export { applyCustomIdentity };
