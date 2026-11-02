import { useLayoutEffect, useState } from "react";
import {
  applyCustomIdentity,
  keepIdentityDarkKeys,
  parseIdentityTokens,
  withIdentityDarkPair,
  type IdentityContrastWarning,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { LIGHT_KEYS } from "@/lib/identity-editor-search";
import {
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  setDocsSiteIdentityOptIn,
} from "@/lib/site-identity-storage";

const LIGHT_KEY_SET = new Set<string>(LIGHT_KEYS);

function withKeptDark(tokens: IdentityTokens, previous: IdentityTokens, keep: readonly string[]): IdentityTokens {
  return keepIdentityDarkKeys(withIdentityDarkPair(tokens, previous), previous, keep);
}

function withSuggestedDark(
  next: IdentityTokens,
  previous: IdentityTokens,
  userKeep: readonly string[],
): { tokens: IdentityTokens; keep: string[] } {
  const generated = withIdentityDarkPair(next, previous);
  const aiKeep = LIGHT_KEYS.filter((key) => next.dark[key] !== previous.dark[key]);
  const keep = [...userKeep];
  for (const key of aiKeep) {
    if (!keep.includes(key)) keep.push(key);
  }
  const merged = keepIdentityDarkKeys(keepIdentityDarkKeys(generated, next, aiKeep), previous, userKeep);
  return { tokens: merged, keep };
}

function patchTokens(
  tokens: IdentityTokens,
  key: string,
  value: string,
  scheme: "light" | "dark",
  keep: readonly string[],
): IdentityTokens {
  const next = LIGHT_KEY_SET.has(key)
    ? { ...tokens, [scheme]: { ...tokens[scheme], [key]: value } }
    : { ...tokens, [key]: value };
  const parsed = parseIdentityTokens(next);
  if (!parsed.success) return tokens;
  return scheme === "light" && LIGHT_KEY_SET.has(key) ? withKeptDark(parsed.data, tokens, keep) : parsed.data;
}

type DraftSnap = { tokens: IdentityTokens; darkKept: string[] };

function nextDarkKept(keep: string[], key: string): string[] {
  return keep.includes(key) ? keep : [...keep, key];
}

function useDraftTokens(present: IdentityTokens, look: string) {
  const [tokens, setTokens] = useState(present);
  const [past, setPast] = useState<DraftSnap[]>([]);
  const [appliedSite, setAppliedSite] = useState(false);
  const [darkKept, setDarkKept] = useState<string[]>([]);

  function remember(next: IdentityTokens, nextKeep: readonly string[] = darkKept) {
    if (next === tokens) return;
    setPast((stack) => [...stack, { tokens, darkKept }]);
    setTokens(next);
    setDarkKept([...nextKeep]);
  }

  function undo() {
    const prev = past.at(-1);
    if (!prev) return;
    setPast((stack) => stack.slice(0, -1));
    setTokens(prev.tokens);
    setDarkKept(prev.darkKept);
  }

  function patch(key: string, value: string, scheme: "light" | "dark") {
    const keep = scheme === "dark" && LIGHT_KEY_SET.has(key) ? nextDarkKept(darkKept, key) : darkKept;
    remember(patchTokens(tokens, key, value, scheme, keep), keep);
  }

  function fix(warning: IdentityContrastWarning) {
    const parsed = parseIdentityTokens({
      ...tokens,
      [warning.scheme]: { ...tokens[warning.scheme], [warning.token]: warning.suggestedForeground },
    });
    if (!parsed.success) return;
    if (warning.scheme === "dark") {
      remember(parsed.data, nextDarkKept(darkKept, warning.token));
      return;
    }
    remember(withKeptDark(parsed.data, tokens, darkKept));
  }

  function applySuggest(next: IdentityTokens, toSite: boolean) {
    const suggested = withSuggestedDark(next, tokens, darkKept);
    remember(suggested.tokens, suggested.keep);
    if (toSite) {
      setDocsSiteIdentityOptIn(true);
      setAppliedSite(true);
    }
  }

  function load(next: IdentityTokens, keep: readonly string[] = []) {
    setTokens(next);
    setDarkKept([...keep]);
    setPast([]);
  }

  useLayoutEffect(() => {
    if (!appliedSite) return;
    applyCustomIdentity(tokens, look, DOCS_SITE_IDENTITY_STORAGE_KEY);
  }, [appliedSite, look, tokens]);

  return {
    tokens,
    darkKept,
    past,
    appliedSite,
    remember,
    undo,
    applySite: () => {
      setDocsSiteIdentityOptIn(true);
      setAppliedSite(true);
    },
    detachSite: () => setAppliedSite(false),
    load,
    patch,
    fix,
    applySuggest,
  };
}

export { useDraftTokens };
