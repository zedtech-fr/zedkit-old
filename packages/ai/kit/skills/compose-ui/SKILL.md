---
name: compose-ui
description: "Write the persona chain brief, then compose UI from it. Use when about to compose, restyle or personalise UI with the kit: pages, specimens, docs demos, identity previews, marketing bands."
---

# Compose UI

A page that fits nobody looks like a template. Write the brief first; every UI choice then points at one line of it. A choice that points at nothing is not made.

## 1. Write the brief (before any UI edit)

Fixed structure, ordered, complete. Keep it with the work: the PR body, plus a comment or file beside the change when reviewers need it.

```
Métier:           what the client's company actually does
Client personas:  who builds or owns the site: goals, constraints, skill level
Customers:        who the client serves
Customer personas: needs, context, device, tasks, emotions
UI decisions:     composition, density, hierarchy, content, tone, components
```

- Fill the first four from the repo, the owner's words or customer material<!-- if:skill=evidence-grounded-analysis --> (`evidence-grounded-analysis`)<!-- /if -->. An empty line is a gap: ask, or mark it `assumed` and say why. Never invent a persona to fill a row.
- Keep each line to one or two sentences; a brief longer than the diff is a spec.
- Several demos or identities (a newsroom, a shop, a console, a booking page) get one brief each. They share a kit, not a voice.
- A site about a product speaks to its client personas first; each specimen on it stands in for _their_ customers.

## 2. Justify each choice

Every line under _UI decisions_ names the earlier line it serves: `dense list, headline-first, because: customer = hurried daily reader on a phone`. A decision with no `because` is dropped or sent back to step 1.

## 3. Compose by the art-direction rules

- **Composition per use case.** A newsroom, a shop, a console and a booking page differ in density, hierarchy and focal point. The same card grid in every section is the template tell.
- **Density and hierarchy follow the persona.** A hurried reader of a daily paper, a shopper browsing ceramics and an operator scanning a dashboard each get a different rhythm.
- **One focal point per band.** Neighbours differ in shape and recede.
- **Type roles, not heading levels.** `h1`–`h4` carry the outline and accessibility. Size and voice come from named type roles (the kit's `typeRole` / `text-zk-type-*` utilities, or the repo's own scale). The 16px minimum belongs to form controls below tablet width, not to every label or caption.
- **Surface roles: page, specimen stage, overlay.** Glass is selective: site chrome may wear it, specimen grids do not by default. One surface role per job.
- **Content, not chrome.** Named businesses, real tasks, precise microcopy: a specimen reads as commissioned for its métier, not as lorem and a logo.
- **Kit tokens only.** No raw hex or ad-hoc pixel colours; fix a wrong value at the layer that owns it.

## 4. Follow the repo's own spec

Open what exists, link it, never copy it:

- `docs/design/signature.md` and the frontend charter, when the repo has them <!-- if:skill=use-signature -->(see also `use-signature`)<!-- /if -->.
- A visual contract or design file the nested `AGENTS.md` names.
- Otherwise the kit's tokens and type roles.

## 5. Check

Done when each _UI decision_ line carries a `because`, the composition differs per use case, and before/after screenshots are attached for any visible change. Hand the diff to `ui-designer` for review: it expects this brief to exist.

## Later: the adaptive interview

The identity assistant's guided flow is meant to run this same chain as an adaptive interview: each answer changes the next question, and the result is this brief. Until it does, the agent writes the brief by hand as above.
