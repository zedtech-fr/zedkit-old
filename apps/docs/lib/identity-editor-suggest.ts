import {
  parseIdentityTokens,
  suggestIdentityTokens,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { LIGHT_KEYS, VALUE_KEYS } from "@/lib/identity-editor-search";

type TokenDiff = { path: string; from: string; to: string };

type SuggestProposal = {
  tokens: IdentityTokens;
  notice: string;
};

function tokenDiff(before: IdentityTokens, after: IdentityTokens): TokenDiff[] {
  const rows: TokenDiff[] = [];
  for (const key of VALUE_KEYS) {
    if (before[key] !== after[key]) rows.push({ path: key, from: before[key], to: after[key] });
  }
  for (const scheme of ["light", "dark"] as const) {
    for (const key of LIGHT_KEYS) {
      if (before[scheme][key] !== after[scheme][key]) {
        rows.push({ path: `${scheme}.${key}`, from: before[scheme][key], to: after[scheme][key] });
      }
    }
  }
  return rows;
}

function tokensFromBody(body: unknown) {
  if (!body || typeof body !== "object" || !("tokens" in body)) return undefined;
  return (body as { tokens: unknown }).tokens;
}

function stubNotice(status: number) {
  if (status === 503) return "Suggest is offline. Keyword match instead.";
  if (status === 429) return "Too many requests. Keyword match instead.";
  return "Suggest failed. Keyword match instead.";
}

function stubProposal(prompt: string, status: number): SuggestProposal {
  return { tokens: suggestIdentityTokens(prompt), notice: stubNotice(status) };
}

function requestIdentitySuggest(prompt: string, current: IdentityTokens): Promise<SuggestProposal> {
  return fetch("/api/identity/suggest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, current }),
  })
    .then((res) => res.text().then((text) => ({ res, text })))
    .then(({ res, text }) => {
      if (!res.ok) return stubProposal(prompt, res.status);
      return Promise.resolve(text)
        .then((raw) => JSON.parse(raw) as unknown)
        .then((body) => {
          const parsed = parseIdentityTokens(tokensFromBody(body));
          if (parsed.success) return { tokens: parsed.data, notice: "Review these token changes." };
          return stubProposal(prompt, 502);
        });
    })
    .catch(() => stubProposal(prompt, 0));
}

export { requestIdentitySuggest, tokenDiff, type SuggestProposal, type TokenDiff };
