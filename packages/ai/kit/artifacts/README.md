# Setup artifact templates

Kit-only templates for **`setup-ai` phase C**. Do not install with `zedkit-ai init`; copy into `.agents/` (and repo glossary path) during a setup run.

| Template                     | Install path                             |
| ---------------------------- | ---------------------------------------- |
| `product.template.md`        | `.agents/product.md`                     |
| `domain/booking.template.md` | `.agents/domain/<area>.md` (rename area) |
| `personas-v2.template.md`    | `.agents/personas.md` (v2 schema)        |
| `design.template.md`         | `.agents/design.md`                      |
| `glossary.template.md`       | `GLOSSARY.md` or `.agents/glossary.md`   |

## Catalog skills (repo copies)

Copy from `artifacts/skills/<name>/` to `.agents/skills/<name>/` when the plan tier says **must** or **should** and the workflow repeats in this repo:

| Catalog skill    | When to propose                                              |
| ---------------- | ------------------------------------------------------------ |
| `add-capability` | Multi-layer features (route + API + data + tests) ship often |
| `add-migration`  | Schema changes are regular and gated                         |
| `domain-change`  | Money, cancel, refund, or policy edits are common            |

After copying, rewrite paths and commands from evidence; run `zedkit-ai validate`.
