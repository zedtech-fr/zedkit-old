---
"@zedtech/zedkit-ai": minor
---

`setup-ai` now records a repo's visual signature in `design.md`: colour roles with exact variable names and values, font families by role, the one accent role kept for the primary action, and exact alias exceptions, each with `file:line`. Readers extract it from stylesheets and tokens, improve mode keeps the rows as written, and `validate --setup` fails when stylesheets define colours and fonts but `design.md` has no `## Signature` section.
