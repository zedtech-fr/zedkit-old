# Plan: make the home page look finished

Stakes: standard
Stakes raised: standard -> sensitive: the Glass look change ships in the published `@zedtech/zedkit-ui` (release change, every consumer of the default look).

Status: amended after challenge (section 8). Not started.

## 1. Starting facts (ground truth)

Observed on https://dev.zedkit.app (v1.9.1) at 1440px, 6 Nov 2026, and in the code.

| # | Fact | Source |
|---|---|---|
| F1 | Home is 8133px tall on desktop. Bands: hero 716, ai-setup 1236, **identities 3802 (47%)**, get-started 1119, components 683, entry-points 504. Mobile height is not measured yet (the pin is already plain tabs on phones, so the saving is desktop-only). | live DOM measure |
| F2 | The identities band is six pinned scroll steps (mist, press, tide, volt, maison, glass), a facts aside per look, then "And yours?". `usePinnedSteps`, `useClippedStage`, the scroll CSS and the mist/tide/volt examples are used by this band only (verified). | `home-identity-looks.tsx`, `home-identity-scroll.css` |
| F3 | The one-prompt AI setup already runs inside the hero window, but the tour plays it **last**, after five pages and three look changes (about 15s on the first lap). The scripted run is 4.8s (`HERO_AGENT_PHASE_MS` = 1500+1300+1100+900); the whole `agentStep` (open, paste, send, run, 2.2s hold, close) is about 11.7s. Phones, touch and reduced motion get no tour. The existing Agent button is already visible on phones. | `use-hero-tour.ts`, `use-hero-agent.ts`, `home-hero-shell-parts.tsx` |
| F4 | Glass today = card colour at alpha 0.66, `blur(18px) saturate(1.6)`, a 1px inset white line, a 0.5px edge, over three faint pastel halos. Blurring near-flat pastel shows nothing, so it reads as "blur backdrop". No specular rim, light direction or content behind it. | `packages/ui/src/identities/glass.css` |
| F5 | Glass consumers (all change with the tokens): `.bg-card`/`.bg-popover` rule (`glass.css`), `[data-surface="glass"]` (`surface.css`, popovers, selects), `[data-widget-button]`, code blocks (`identities.css`), `GlassSurface` (sets its own `shadow-md/lg/xl`, which beat the `:where()` card rule), marketing header, dialog and drawer panels, `#nd-nav::before`, `#demo::before` and `[data-identity-frame-stage]::before` (`site-compact.css`). The registry copy `registry/ui/surface.tsx`, `etc/*.api.md` and `marketing.test.tsx` also track it. The hero satellites are plain `Card`s. The hero window is deliberately **not** a backdrop-filter element (fixed toasts). | grep of the repo |
| F6 | "Ways to start" lives in four places: three hero CTAs, `get-started` (install panel, a one-button result card, two ghost links), `entry-points` ("More in the kit": 4 rows, copy cut by `summary.split(".")[0]`, "64 needs" counts) and the AI band. | `home-hero-lead-actions.tsx`, `home-get-started-section.tsx`, `home-secondary-section.tsx` |
| F7 | Contract lines in the way: "no decorative gradients", "shadow only on overlays and raised controls", "no count in identity copy", "never one page restyled six times", "on a wide, tall screen the scroll picks the look" (`VISUAL-CONTRACT.md` 80, 86, 108; `signature.md` 37, 69; `packages/ui/AGENTS.md`). Edits ship in the PR that first needs them. | those files |
| F8 | `check-tone.sh` bans a short list of promo words and phrases (decoded in the script). | `scripts/check-tone.sh` |
| F9 | Only two specs use `toHaveScreenshot`, both Glass chrome: `shell-nav-calm`, `dialog-surface`. Baselines are Linux only. | `apps/docs/tests` |
| U1 | Unverified: the kit has unit coverage equal to what `home-identity-looks.spec.ts` L162-365 gives Drawer, Dialog, Switch and filter (focus return, trap, 13px floor, density). Check before deleting tide and volt. | T4 |
| U2 | Unverified: a mature package beats a CSS recipe for the rim and fill. Rung 4 holds; no package is planned. | T3a |

## 2. Spec

### Problem
A first-time visitor sees a capable kit that reads like a draft: the headline sells AI setup while the demo shows it last; a 3800px band shows six looks without saying why; the ways to start are scattered; copy sounds like notes; the "glass" is a blur.

### Solution
One home page where every band has one job and one shape:

1. **Hero**: proposition and live window. The cursor opens the Agent first, runs the prompt once (first lap only), then tours the app. Anyone without a tour taps the existing Agent button and finds the prompt already in place, one tap from running.
2. **AI setup**: the copyable prompt and the real file tree (kept, no longer repeats the hero).
3. **Looks**: three product screens in one stage, no pinning (about 900px instead of 3800px).
4. **Start your way**: one chooser, three paths, one command each.
5. **Find a component**, then **Beyond the UI** (backend, SEO) as a slim strip.
6. **Glass** becomes a real material (rim light, clearer fill, saturation and brightness, colour behind it) with solid fallbacks.

Targets: desktop height 8133px to 5500px or less; mobile stays under the existing 8000px budget (measured first, T1).

### User stories
1. As a developer arriving cold, I see the AI setup start by about 3s and finish by about 10s without touching anything, so the headline is proven.
2. As a phone or reduced-motion visitor, I tap Agent and see the prompt already filled, so one tap shows the same run (reduced motion: the finished state, no motion).
3. As a visitor who takes over mid-run (press a page entry), the panel ends closed or finished, never stuck.
4. As an app developer, I pick one of three paths and get the exact command, so my next step is clear in one read.
5. As someone without code, I find the assistant path by name, so I do not scroll for it.
6. As an evaluator, I see a dense console, a shop and a newsroom from the same components, so I judge range without scrolling 3800px.
7. As a maintainer, every install snippet still comes from `adoption-plan.mjs`, so docs and smoke tests agree.
8. As a Safari or Firefox visitor, glass looks finished (same rim and fill; no feature depends on a Chromium-only filter).
9. As a visitor asking for reduced transparency or forced colors, surfaces are solid and readable.
10. As a keyboard user, I reach the chooser tabs, the looks switcher and the Agent button in order, with a visible focus ring.
11. As a library consumer on the Glass look, I read the change in the release notes and can still override `--zk-glass-alpha`.

### Implementation decisions
- **Tour**: `agentStep` runs at the start of the first lap only; later laps loop the five pages. Holds are trimmed (the 900ms and 2200ms waits) so the first lap shows the finished run by about 10s. `reset(true)` on replay stays. A takeover during the run leaves the panel closed or finished.
- **Agent button**: opens the panel with `AI_SETUP_MINI_PROMPT` prefilled. No new control. If T1 shows phones still miss it, a rung-6 follow-up is allowed; a new control would need `data-hero-tour-control`.
- **Glass, kit layer (T3a)**: the rim lives in `--zk-shadow-*` and `--zk-glass-highlight` (so `GlassSurface`'s `shadow-*` utilities carry it), not in a `.bg-card` rule. Fill is a two-stop gradient (clearer than 0.66) with `blur + saturate + brightness`; top-left specular inset, bottom-right soft inset, inner glow, outer 0.5px hairline, tinted soft shadow; paired dark values. Every consumer in F5 is checked. No pseudo-elements on elements the kit does not own. **No lensing** (`backdrop-filter: url()` is Chromium-only and its fallback is lost where it parses but is ignored); a separate experiment later, with a device measure.
- **Glass, docs layer (T3b)**: higher-chroma halos in `--zk-bg-pattern` and two or three soft shapes behind the hero window edges and satellites. The satellites become glass by an explicit hook, not by `.bg-card`. Shapes are clipped so nothing widens the page (`home-hero.spec.ts` overflow guard).
- **Contrast is a token invariant**: text-bearing cards keep a minimum fill alpha; the clearest glass is for chrome and ornament. Tested by computing colour over the real halo values (axe cannot see gradients and blur).
- **Backdrop-root trap**: the satellites sit in animated layers (opacity, float, drift). They only blur once the entrance has settled, and a test proves it.
- **Looks band**: three examples in one stage, switcher named by product. Default trio: **Mist (dense dev console), Maison (bag shop), Press (newsroom)**; the Glass look is shown by the hero and the page itself. Facts shrink to one caption line; "And yours?" stays as the closing row. Pinned scroll is removed (contract lines edited in the same PR). Tide and volt examples are deleted only after U1 passes; they stay reachable from the editor and `/features/identity-kit-demos`.
- **Start band**: tabs by intent ("Add it to my app", "Copy the source", "No code: design a look"), one panel, commands from `adoption-plan.mjs`. The AI path stays in its band and is linked from the chooser. **Anchor ids stay** (`#ai-setup`, `#identities`, `#get-started`, `#entry-points`) so links and specs keep working; only visible titles change.
- **Copy**: strings stay in `ui/home/i18n/*`; reviewed with the `copywriter` lens; the H1 and the AI band H2 change in the same PR (T2) so the page never contradicts itself.

### Testing decisions
- Test behaviour, not class names: computed `backdrop-filter`, `box-shadow` and background on a Glass scope node in light and dark, nested in another look (contract "cascade boundaries"), and on each consumer in F5.
- Tour: the Agent panel opens before any page change on the first lap; red on `main`, green after T2. A takeover during the run ends closed or finished.
- Agent button: prefilled, one tap runs, reduced motion shows the end state.
- Contrast: AA on settled text over Glass in both modes against the worst-case halo; a floor on card alpha; `prefers-reduced-transparency` and `forced-colors` give solid surfaces.
- Backdrop-root: satellites blur after the entrance (computed backdrop-filter present and no running opacity/filter ancestor).
- Layout: page height at 390 and 1440; no horizontal overflow at 320, 390, 768, 1024, 1440, 1920; 200% zoom.
- Prior art: `home.spec.ts`, `home-demo-mobile.spec.ts`, `identity-nested-dark.spec.ts`, the two Linux screenshot baselines.

### Out of scope
Docs pages other than the home content (they inherit the Glass change; see T1 for the before/after set), the identity editor, other identities' tokens, new kit components, lensing, deployment.

## 3. Ladder per piece

| Piece | 1 Need? | 2 In codebase? | 3 Stdlib? | 4 Native / tool? | 5 Installed dep? | 6 One line? | Rung |
|---|---|---|---|---|---|---|---|
| Tour: agent first, first lap only | yes | yes, `LAP`, `agentStep` | n/a | n/a | n/a | move one call + a flag | 6 |
| Agent button prefilled | yes | yes, `useHeroAgent`, panel | n/a | n/a | n/a | a few lines | 2 |
| New "Watch" control | **no** (existing Agent button covers it) | | | | | | 1 |
| Glass rim, fill, saturation | yes | partly, `--zk-glass-*` | n/a | yes: `backdrop-filter`, layered `box-shadow`, gradients | no extra | no | 4 |
| Lensing (SVG displacement) | **not now** | | | Chromium-only, fallback lost | | | 1 (cut) |
| Pointer highlight | **cut** (no owner, no need for "real glass") | | | | | | 1 |
| Halos and hero shapes | yes (F4 root cause) | yes, `--zk-bg-pattern` | n/a | CSS | n/a | token edit + 2 shapes | 4 |
| Looks band 6 to 3, no pin | yes | yes, tabs and examples | n/a | n/a | n/a | deletion | 1 |
| Delete pin hooks, scroll CSS, tide/volt examples | after U1 | n/a | n/a | n/a | n/a | n/a | 1 |
| Start chooser | yes | yes, `Tabs`, `AdoptionPanelView`, `adoption-plan.mjs` | n/a | n/a | n/a | no | 2 |
| Beyond-the-UI strip | yes, replaces `entry-points` rows | yes, `home-entry-points.json` | n/a | n/a | n/a | no | 2 |
| Copy rewrite | yes | yes, i18n files | n/a | n/a | n/a | n/a | 2 |
| Contract, signature and AGENTS.md edits | yes (they now contradict the code) | yes, same files | n/a | n/a | n/a | n/a | 2 |
| Test migration (section 5) | yes | yes, existing specs | n/a | n/a | n/a | n/a | 2 |
| New dependency | no | | | | | | none |

## 4. Tickets and order

T0 and T1 are not PRs. Every PR is from fresh `main`, never stacked (merge, then start the next), carries its own copy, test migration, contract edits, baselines (regenerated in the Playwright Linux image, opened and judged), before/after screenshots at 390 and 1440 in light and dark, a rendered-page critique and the four-lens review. A kit change needs a changeset and a rebuild of `@zedtech/zedkit-ui` before judging localhost:3100.

| ID | Ticket | Kind | Needs | Blocked by |
|---|---|---|---|---|
| T0 | Owner decisions (section 7) | decide | reasoning=low | none |
| T1 | Baseline: before screenshots of home at 390 and 1440, plus a docs-wide before set for the Glass change (a component page, getting-started, a dialog, the header), page heights desktop and mobile, a throttled scroll profile, a frame capture of the tour | check | reasoning=low | none |
| PR-A | **Looks band**: three examples, one stage, no pin, delete dead code, contract edit, spec migration. Biggest win (about 2900px), lowest risk. | build | reasoning=medium, context=medium | T0, T1 |
| PR-B | **Hero**: agent first on lap one, prefilled Agent button, H1 + hero lead + AI band H2 together, spec migration | build | reasoning=medium, context=medium | T0, T1 (independent of PR-A) |
| PR-C | **Glass kit (T3a)**: tokens, all F5 consumers, dark pairs, fallbacks, minor changeset with before/after, signature.md and contract edit, baselines for `shell-nav-calm`, `dialog-surface`, spec edits for `identity-glass*` | design then build | reasoning=high, context=large | T0, T1 |
| PR-D | **Glass docs (T3b)**: halos, hero shapes, satellites as glass, overflow and backdrop-root tests | build | reasoning=medium, context=medium | PR-B, PR-C |
| PR-E | **Start your way** + Beyond the UI, hero CTAs aligned, spec migration | build | reasoning=medium, context=medium | PR-A |
| PR-F | **Polish**: rhythm, band shapes, hover and focus, gaps, height budgets, remaining copy (Find a component), per-band critique with fixes | check then build | reasoning=high, context=large | PR-A to PR-E |

## 5. Test migration (one owner per row)

| Spec | What breaks | Owner |
|---|---|---|
| `home-hero.spec.ts` L230-250 | expects Apps within 3.5s and a table sort within 4s; the agent now runs first | PR-B |
| `home-hero.spec.ts` L256-279 | "tour ends its lap in the Agent panel" is the opposite of the new design: rewrite, not delete | PR-B |
| `home-hero.spec.ts` L446 | overflow guard must still pass with hero shapes | PR-D |
| `home.spec.ts` L15, 43, 55, 371 | pins "top-notch", "Play with it yourself", the `#get-started` and "Set up AI" links | PR-B (copy), PR-E (links) |
| `home-ai-setup.spec.ts` L18, 41, 90 | pins the AI band H2 and "top-notch" | PR-B |
| `home-identity-looks.spec.ts` | six tabs, title, "Live components, not screenshots"; L162-365 is the drawer, dialog, switch, filter integration test | PR-A (keep it on Mist, check U1 for tide and volt) |
| `home-identity-scroll.spec.ts` | tests the pin | PR-A (delete) |
| `home-use-cases.spec.ts` L84 | "one example tab per identity" | PR-A |
| `home-layout.spec.ts` L4, 80-115 | `#identities`, `#entry-points`, `[data-identity-pin]`, `data-snap` | PR-A, PR-E |
| `home-install-or-copy.spec.ts` L16-45 | pins "Install package / Copy source" tabs | PR-E |
| `home-mobile-page-height.spec.ts` | budget 8000px | PR-F (lower it to the new measure) |
| `identity-glass.spec.ts` | bar alpha 0.55-0.7 | PR-C |
| `identity-glass-overlays.spec.ts` L113, 174-182 | reduced-transparency alphas, white and grey backdrops only | PR-C |
| `shell-nav-calm.spec.ts`, `dialog-surface.spec.ts` | screenshot baselines | PR-C |
| `registry/ui/surface.tsx`, `etc/*.api.md`, `marketing.test.tsx` | follow GlassSurface | PR-C |

## 6. Copy direction (for the `copywriter` lens; proposals, not final)

Voice: plain, factual, one idea per line. No superlatives (`top-notch` goes everywhere in the same PR).

| Place | Now | Proposal |
|---|---|---|
| H1 | "A top-notch AI setup, one prompt away. Only the UI you need." | "Your AI agent, set up with one prompt. The UI, only what you need." |
| AI band H2 | "One prompt gets you a top-notch AI setup" | "One prompt, and your agent knows your repo" |
| Window caption | "Play with it yourself" + "Everything in this app is a zedkit component. Click through the pages, add an app, change the look." | "This app is built from zedkit components. Watch the setup run, then click around." |
| Looks title | "Same components, different products" | "Looks like your product" |
| Looks body | long paragraph that mentions the Display row | "A console, a shop and a newsroom, built from the same components." |
| Start | "Get started" / "More in the kit" | "Start your way" / "Beyond the UI" |
| Entry rows | "64 needs · Components, layout, forms, ..." | one short sentence each, no counts, no truncation |

## 7. Decisions for the owner (defaults in bold)

1. Looks band: **three looks (Mist, Maison, Press)**, hero and page carry Glass; or keep all six in a simpler, unpinned layout.
2. Contract amendment: **Glass (the default look) may use a specular rim and decorative halos**, nothing else changes.
3. Start chooser: **npm, copy source, no-code look**; AI stays in its band and is linked.
4. Lensing: **left out now**, a separate experiment with a device measure.

## 8. Challenge (skeptic pass, verdict: amend; applied)

| # | Objection | Resolution in this plan |
|---|---|---|
| 1 | T3 mixes kit and docs in one PR; Glass is the default look, so halos hit every docs page | split into PR-C (kit) and PR-D (docs); docs-wide before set in T1 |
| 2 | Consumer list incomplete; `GlassSurface` `shadow-*` beats a `.bg-card` rule; satellites are plain `Card`s | F5 lists all consumers; rim in `--zk-shadow-*`; satellites get an explicit hook |
| 3 | Existing specs that break were not planned | section 5, one owner per row |
| 4 | Deleting mist, tide, volt drops integration coverage; Press, Maison and Glass are all airy | Mist kept in the trio; U1 gate before deleting tide and volt |
| 5 | Agent each lap is about 12s forever; the "5 seconds" claim is wrong (run is 4.8s) | first lap only, holds trimmed, story is "start by 3s, done by about 10s" |
| 6 | "Watch" duplicates the Agent button; a new control would count as a takeover | no new control; prefill the existing button |
| 7 | Lensing: fallback lost where `url()` parses but is ignored; repaint cost; SVG ids | cut |
| 8 | Contrast cannot be proven by axe over gradients | worst-case computation and an alpha floor as a token invariant |
| 9 | Backdrop-root trap in animated satellites; shapes may widen the page | settled-entrance test and overflow guard in PR-D |
| 10 | Contract conflicts fixed too late | edits ship in the PR that first needs them |
| 11 | Ordering: T4 and T2 do not depend on glass; baselines last would break CI; T0 and T1 are not PRs | order PR-A, PR-B, PR-C, PR-D, PR-E, PR-F; baselines per PR |
| 12 | Copy inconsistent between PRs; anchor ids | H1 and AI H2 together in PR-B; anchor ids stay |
| 13 | Ladder gaps | rows added in section 3 |

Pre-mortem kept as checks: takeover during the run (test in PR-B), Glass consumers see a visible change (minor bump, `--zk-glass-alpha` stays overridable), low-end and Safari scroll (blur 10px on phones stays; throttled profile in T1 and PR-C).

Verdict after amendments: proceed once T0 is answered.
