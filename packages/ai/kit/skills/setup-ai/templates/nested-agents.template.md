# Nested AGENTS.md

Copy to `<folder>/AGENTS.md` for each folder whose rules differ from the root (features, ui, design, api, db, jobs, …). Built from the readers' **Folder notes** and the rules landed for that slice. Keep it under about 60 lines; it loads whenever an agent works in this folder.

---

# AGENTS.md — {folder}

{One line: what this folder is and who owns it.}

1. **{Rule that differs from the root}.** {Why. Enforced by `{checker path or rule}`, or `documented, not enforced`.} (`file:line`)
2. **{Boundary}.** {Who may import this folder, what it may not import.} (`file:line`)
3. **{Trap}.** {What an agent gets wrong here, and what is true instead.} (`file:line`)

## Domain and identity

- Domain rules for this folder: `.agents/domain/{area}.md` as a relative markdown link from this folder — link, do not copy.
- Design and voice (UI folders): `.agents/design.md`, linked the same way; strings live in `{i18n path}`.

## Check

`{the command that proves a change here is good}` — run it before you call work done. Prefer this folder's unit/integration command. If only an e2e script exists, label it observed and still recommend the narrower suite when present. Unit and integration tests are primary; E2E/browser only if this folder owns an explicitly justified critical user path.

---

Rules for writing one:

- Only what differs from the root `AGENTS.md`. A rule the root already states is deleted here.
- Every rule cites `file:line` you opened. Say `documented, not enforced` unless you opened a checker that fails when the rule breaks.
- Count the `../` depth from this folder so each link resolves (`test -e` each one).
- Cursor wired? Add `.cursor/rules/{folder}.mdc` with `globs: {folder}/**` and one line pointing at this file. Do not copy the rules into it.
- A nested file already exists? Extend it in place (rules from the folder notes, links to `.agents/domain` and `.agents/design`, evidence); keep the author's wording.
- Folders that need nothing get nothing. Record `nested-agents: none — <reason>` (or `kept — <reason>` for files you left as they are) in `.agents/setup-log.md`.
