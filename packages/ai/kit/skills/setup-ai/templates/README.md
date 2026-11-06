# Setup templates (installed with `setup-ai`)

These files ship in **this skill folder** at `.agents/skills/setup-ai/templates/`. During phase C/D, read them here and copy customized output into `.agents/` (or repo glossary path). Fictional **Acme Bookings** examples appear only in these templates.

| Template                               | Install path                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `templates/product.template.md`        | `.agents/product.md`                                                                                           |
| `templates/domain/booking.template.md` | `.agents/domain/<area>.md` (rename `<area>`)                                                                   |
| `templates/personas-v2.template.md`    | `.agents/personas.md` (v2; `setup` init installs this file — phase C edits it in place)                        |
| `templates/design.template.md`         | `.agents/design.md`                                                                                            |
| `templates/glossary.template.md`       | `GLOSSARY.md` or `.agents/glossary.md`                                                                         |
| `templates/nested-agents.template.md`  | `<folder>/AGENTS.md` for each folder whose rules differ from the root                                          |
| kit `tokenomics.template.md`           | `.agents/tokenomics.md` (already installed; fill `providers.<p>.<kind>.<stakes>.model`, then `zedkit-ai sync`) |

## Read the code first (phase B)

Used in place, never copied to the repo as-is:

| Template                                 | Use                                                                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `templates/reader-brief.template.md`     | Self-contained brief pasted into each read-only reader (one per slice from `npx zedkit-ai scan`)                                  |
| `templates/rule-check-brief.template.md` | Self-contained brief for the second reader that checks each rule says what the code does (order, atomicity, timing)               |
| `templates/reading-log.template.md`      | Shape of `.agents/setup-log/reading.md`: reader rows, merged rules, meaning check, interview gaps (checked by `validate --setup`) |

## Score and learn (phase E)

Read in place, never copied wholesale:

| Template                          | Use                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `templates/setup-rubric.md`       | Ten axes (0–3 each), hard gates; mean >= 2.5 over **8 measurable axes**; Discovery and Domain rules reported apart       |
| `templates/setup-log.template.md` | Entry block to append to `.agents/setup-log.md`; plan rows and gate logs checked by **`npx zedkit-ai validate --setup`** |
| `templates/kit-issue.template.md` | One public-safe kit issue draft per friction found                                                                       |

## Catalog skills (repo copies)

Copy from `templates/catalog/<name>/SKILL.md.tmpl` to `.agents/skills/<name>/SKILL.md` when the plan tier says **must** or **should**. Each file is ready to install as-is: frontmatter included, no placeholders, links resolve once phase C wrote `product.md` and `domain/`.

| Catalog skill  | When to propose                                              |
| -------------- | ------------------------------------------------------------ |
| add-capability | Multi-layer features (route + API + data + tests) ship often |
| add-migration  | Schema changes are regular and gated                         |
| domain-change  | Money, cancel, refund, or policy edits are common            |

After copying, edit only what this repo contradicts (a gate command, a path you verified); run `zedkit-ai validate`.
