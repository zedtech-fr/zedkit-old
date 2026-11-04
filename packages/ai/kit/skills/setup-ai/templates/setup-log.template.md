# Setup log

Append one entry per `/setup-ai` run, newest first. Each entry records what the run learned so the next run (or the next repo) starts smarter.

<!-- setup-ai: copy the entry block below into `.agents/setup-log.md`, newest first -->

## YYYY-MM-DD — fresh with the setup preset (providers: cursor, claude)

- **What worked:** mining the docs before asking; the batched interview closed the rest in one round.
- **What hurt:** the main gate needs a database; ran the read-only checks and marked the gate `UNVERIFIED`.
- **Scores:** discovery 2, personas 2, domain rules 2, design 2, architecture 2, gates 1, skills 2, providers 2, friction 2, self-improvement 2 — mean 1.9. Evidence: `.agents/product.md`, `.agents/domain/booking.md`, transcript §3.
- **Decisions:** wire cursor + claude now, codex later (`source: owner`); keep the team's `.cursor/skills` folder, link kit skills inside it.
- **Open kit frictions:** none this run (or: one draft below).
- **Re-audit:** after the next release, or when product, domain rules, or providers change.

## Kit issue drafts from this run

Paste each draft into the kit tracker as its own issue. See `kit-issue.template.md` in this folder.
