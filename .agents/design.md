# Design and identity

Specimens use Glass (`docs/design/reference-decisions.md:9`). Docs chrome first paint is Glass (`apps/docs/lib/default-identity.ts:7`, applied in `apps/docs/app/layout.tsx:53`). Tide is an opt-in look, not the site default. Two owners (specimen vs chrome); chrome default is Glass.

Route model choice through the kind × stakes cell in `.agents/tokenomics.md`.

## Identity rules

| ID | Status | Rule | Source | Test / check |
|----|--------|------|--------|--------------|
| I-01 | current | Public wording only: say "an upstream consumer", never a private project name. | `AGENTS.md:11` | `scripts/check-no-private-refs.sh:1` |
| I-02 | current | Neutral, professional tone; no self-promotional marketing terms. | `apps/docs/AGENTS.md:5` | `scripts/check-tone.sh:2` |
| I-03 | current | Kit chrome strings come from `ZedkitUiProvider` with English default. | `packages/ui/AGENTS.md:34` | lint + vitest per package |

## Signature

Colour roles and font families below copy exact CSS variable names and values from Glass (specimens and docs chrome first paint) and stock (no identity). Tide opt-in tokens are not restated here.
<!-- Sources: docs/design/reference-decisions.md:9 Glass; apps/docs/lib/default-identity.ts:7; apps/docs/app/layout.tsx:53. -->

**Colour roles**

| Role | Token | Value | Source |
|------|-------|-------|--------|
| action | `--primary` | `243 70% 46%` | `packages/ui/src/identities/glass.css:31` |
| accent | `--accent` | `262 85% 70%` | `packages/ui/src/identities/glass.css:37` |
| page | `--background` | `220 60% 97%` | `packages/ui/src/identities/glass.css:25` |
| text | `--foreground` | `224 45% 12%` | `packages/ui/src/identities/glass.css:26` |
| stock action | `--primary` | `240 5.9% 10%` | `packages/ui/src/styles.css:44` |
| stock accent | `--accent` | `240 4.8% 59.9%` | `packages/ui/src/styles.css:50` |

**Font families by role**

| Role | Token | Value | Source |
|------|-------|-------|--------|
| body font | `--zk-font-sans` | `"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `packages/ui/src/identities/glass.css:56` |
| display font | `--zk-font-display` | `"Space Grotesk Variable", "Space Grotesk", "Space Grotesk Variable Fallback", "Inter Variable", "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif` | `packages/ui/src/identities/glass.css:57` |
| mono font | `--zk-font-mono` | `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | `packages/ui/src/identities/glass.css:58` |
| stock body font | `--zk-font-sans` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `packages/ui/src/identities.css:35` |
| stock mono font | `--zk-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | `packages/ui/src/identities.css:37` |

Accent: `--accent` (`262 85% 70%`) is the accent role, distinct from the `--primary` action role (`packages/ui/src/identities/glass.css:37`).
