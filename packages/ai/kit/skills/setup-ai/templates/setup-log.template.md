# Setup log

Append one entry per `/setup-ai` run, newest first. Each entry records what the run learned so the next run (or the next repo) starts smarter.

<!-- setup-ai: copy the entry block below into `.agents/setup-log.md`, newest first -->

## YYYY-MM-DD — fresh with the setup preset (providers: cursor, claude)

- **What worked:** mining the docs before asking; the batched interview closed the rest in one round.
- **What hurt:** the main gate needs a database; ran the read-only checks and marked the gate `UNVERIFIED`.
- **Providers (always paste the full value table):**

| Provider | Value                                                      |
| -------- | ---------------------------------------------------------- |
| `cursor` | Rules, skills, agents and commands inside the IDE          |
| `claude` | The same setup for Claude Code sessions, linked not copied |
| `codex`  | Reads the shared source directly; nothing extra to install |
| `muse`   | Reads the shared source directly; nothing extra to install |

- **Wired:** cursor, claude (example)
- **Sidecar cleanup:** removed `.agents/personas.kit.md` — sidecar was only the superseded Acme template after phase C edit (or: none)
- **Gate outcomes:** (one row per gate command you attempted; persisted logs must end with `EXIT:<code>`)

| Gate command | Exit | Duration | Did not run / why | Safe alternative used                                    |
| ------------ | ---- | -------- | ----------------- | -------------------------------------------------------- |
| `pnpm test`  | 137  | 45s      | OOM kill          | `pnpm exec turbo run test --concurrency=2` with heap cap |

Example persisted block:

```text
START: 2026-11-04T10:00:00Z
pnpm exec turbo run typecheck lint test --concurrency=2
EXIT:0
END: 2026-11-04T10:12:00Z
```

- **Scores:** discovery 2, personas 2, domain rules 2, design 2, architecture 2, gates 1, skills 2, providers 2, friction 2, self-improvement 2 — mean 1.9. Evidence: `.agents/product.md`, `.agents/domain/booking.md`, transcript §3.
- **Decisions:** wire cursor + claude now, codex later (`source: owner`); keep the team's `.cursor/skills` folder, link kit skills inside it.
- **Kit frictions:** one draft per friction below (or: none this run)
- **Re-audit:** after the next release, or when product, domain rules, or providers change.

## Kit issue drafts from this run

Paste each draft into the kit tracker as its own issue. See `kit-issue.template.md` in this folder. **One draft per friction** with kit root cause filled.
