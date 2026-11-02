# AGENTS.md — deploy

Docs hosting (Caddy and compose on one VM) and the identity suggest service
(`suggest/`: plain Node ESM, no workspace dependencies, `node:test`). Settings,
secrets and operations: [README.md](README.md), the maintainers' page.

Tests: `node --test deploy/*.test.mjs deploy/suggest/*.test.mjs` (also in
`pnpm test:registry`). `suggest/tokens.parity.test.mjs` needs the built UI
kit: `pnpm exec turbo run build --filter=@zedtech/zedkit-ui`.

## Identity suggest service

1. **Output is data, never code.** The service returns constrained identity
   tokens. Never accept or emit executable code, free CSS or HTML (`url()`,
   at-rules, braces, comments).
2. **One schema, validated at both ends.** The kit's `parseIdentityTokens`
   (`packages/ui/src/identity-tokens.ts`) validates in the browser;
   `suggest/tokens.mjs` is a port, guarded by `suggest/tokens.parity.test.mjs`.
   Change the kit schema, port it, keep parity green. Never loosen one side.
3. **References are untrusted text.** `https` only, public addresses only
   (checked at lookup, not just on the URL string), every redirect re-checked,
   no cookies, size and time caps. What comes back is text-only: report it
   that way, never as a visual analysis of the page.
4. **Paid generation is opt-in and bounded.** It stays off until an operator
   sets the switch, an approved budget and the model prices; there is no
   default budget or price. Reserve the worst case atomically before the
   provider is called, settle after. No unbounded retry or repair loop: at most
   the primary, then the fallback once; invalid output is refused, not re-asked.
   A `DISABLED` file in the state volume is the kill switch, read on every
   request. Maintainers control all of it from [README.md](README.md).
5. **Logs name no brief, URL or address.**

The suggest client lives in `apps/docs/lib/identity-editor-suggest.ts`; its
rules are in [apps/docs/AGENTS.md](../apps/docs/AGENTS.md).
