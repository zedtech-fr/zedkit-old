# Setup templates (installed with `setup-ai`)

These files ship in **this skill folder** at `.agents/skills/setup-ai/templates/`. During phase C/D, read them here and copy customized output into `.agents/` (or repo glossary path). Fictional **Acme Bookings** examples appear only in these templates.

| Template                               | Install path                                 |
| -------------------------------------- | -------------------------------------------- |
| `templates/product.template.md`        | `.agents/product.md`                         |
| `templates/domain/booking.template.md` | `.agents/domain/<area>.md` (rename `<area>`) |
| `templates/personas-v2.template.md`    | `.agents/personas.md` (v2 schema)            |
| `templates/design.template.md`         | `.agents/design.md`                          |
| `templates/glossary.template.md`       | `GLOSSARY.md` or `.agents/glossary.md`       |

## Catalog skills (repo copies)

Copy from `templates/catalog/<name>/SKILL.md.tmpl` to `.agents/skills/<name>/SKILL.md` when the plan tier says **must** or **should**. Add YAML frontmatter (`name`, `description`) on copy.

| Catalog skill  | When to propose                                              |
| -------------- | ------------------------------------------------------------ |
| add-capability | Multi-layer features (route + API + data + tests) ship often |
| add-migration  | Schema changes are regular and gated                         |
| domain-change  | Money, cancel, refund, or policy edits are common            |

After copying, rewrite paths and commands from evidence; run `zedkit-ai validate`.
