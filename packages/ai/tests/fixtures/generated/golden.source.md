---
name: golden
# a comment that stays with the name
description: "Golden: it says \"hi\", then: stops. Use when testing."
role: probe agent
default_needs:
  reasoning: high
  context: medium
kinds:
  - check
  - build
default_kind: check
model: inherit
disallowedTools: Write, Edit, NotebookEdit
---

Body line one.

---

A rule above stays, and so does the last line with no newline.