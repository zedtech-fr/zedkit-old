---
name: use-signature
description: "Follow the project's visual signature and identity state matrix. Use when changing type, motion, composition, identity UI, or assistant/widget states. Skip kit primitives and specimens that must match a primitive's own look."
---

# Use the signature

A _signature_ is named type roles, named motions, composition, and elevation — not raw `font-size` or duration. A _state matrix_ is the required assistant/widget states and viewports.

## Branches

1. **No signature spec and no identity surface** — stop. One line: nothing to follow.
2. **Kit primitive, or a specimen that must match that primitive's look** — stop. The primitive owns its look.
3. **Site chrome, identity UI, or assistant/widget** — follow the spec the nested AGENTS.md names.

## Follow (branch 3)

1. Open the signature spec and the state-matrix proof the nested AGENTS.md points at. If those files exist and AGENTS.md does not point at them, add the pointer; do not copy the tables into always-loaded files.
2. Type: visual roles from the spec, not heading level, not a raw `font-size`.
3. Motion: only named motions the spec lists. Motion explains a transition or preserves context. `prefers-reduced-motion` still holds.
4. Composition and elevation: the spec's grid and surface roles.
5. Identity assistant or floating dock: every state the spec names (typically idle, loading, success, error, quota, resume) at every viewport it names. Quota copy names a real retry time. Loading is a named state, not a spinner alone.

Done when: the change uses spec tokens and utilities, and the state-matrix proof still covers each required cell.
