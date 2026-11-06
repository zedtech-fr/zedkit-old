# Setup log

Append one entry per `/setup-ai` run, newest first. Each entry records what the run learned so the next run (or the next repo) starts smarter. Write each entry in one atomic write after all gates finished — never a stub grown by appends; `validate --setup` reads the finished file.

<!-- setup-ai: copy the entry block below into `.agents/setup-log.md`, newest first -->

## YYYY-MM-DD — fresh with the setup preset (providers: cursor, claude)

- **What worked:** mining the docs before asking; the batched interview closed the rest in one round.
- **What hurt:** the main gate needs a database; ran the read-only checks and marked the gate `UNVERIFIED`.
- **Providers (always paste the full value table):**

| Provider | Value                                                                       |
| -------- | --------------------------------------------------------------------------- |
| `cursor` | Rules, skills, agents and commands inside the IDE                           |
| `claude` | The same setup for Claude Code sessions, linked not copied                  |
| `codex`  | Reads the shared source directly; nothing extra to install                  |
| `muse`   | Native marked files in `.agents/agents`; kit/unmarked files stay the source |

- **Wired:** cursor, claude (example)
- **Reading:** medium repo, 8 readers as `check`/`standard` from `npx zedkit-ai scan`; 61 rules merged, 4 dropped after spot-checks; log at `.agents/setup-log/reading.md`; interview cut to 5 questions because the code answered the rest.
- **Routing:** provider cursor; `check.standard` = {cheap fast model}, `build.standard` = {mid}, `decide.sensitive` = inherit; readers passed `zedkit-ai route explorer --kind check --stakes standard`; file at `.agents/tokenomics.md`; `zedkit-ai sync` run.
- **Nested:** extended `apps/web/AGENTS.md` and `packages/billing/AGENTS.md` in place, linked to `.agents/domain/` (log it as `nested-agents: extended — <files>`, `none — <reason>` or `kept — <reason>`)
- **Plan gaps:** paths changed after the plan table but missing rows (or: none — reconciled with `git diff --name-only` and **`npx zedkit-ai validate --setup`** clean; use **`--plan <file>`** when the plan is not **`PLAN.md`** at the repo root or **`.agents/setup-log/plan.md`**)
- **Unenforced rules:** (architecture score 3 — or: none; cite the domain rule ID for domain rules, e.g. `B-01`)

| Rule ID | Prose rule (AGENTS or nested) | Lint / CI proposal or ticket draft | Evidence                   |
| ------- | ----------------------------- | ---------------------------------- | -------------------------- |
| —       | "Never commit secrets"        | add gitleaks to CI job X           | `.github/workflows/ci.yml` |

- **Sidecar cleanup:** removed `.agents/personas.kit.md` — sidecar was only the superseded Acme template after phase C edit (or: none)
- **Deferred skill stubs:** (or: none — all high-risk types installed)

| Skill         | Stub / reason                       |
| ------------- | ----------------------------------- |
| domain-change | deferred — no money paths in v1 yet |

- **Gate outcomes:** (one row per persisted gate log: every file in **`.agents/setup-log/gates/`** appears below by name, killed logs included; each `*.log` starts with **`CMD:`** and ends with **`EXIT:<code>`** as its last line — **`npx zedkit-ai validate --setup`** checks plan coverage, log shape, and that every log file is inventoried)

| Log              | Gate command | Exit | Duration | Did not run / why | Safe alternative used                                    |
| ---------------- | ------------ | ---- | -------- | ----------------- | -------------------------------------------------------- |
| `gates/test.log` | `pnpm test`  | 137  | 45s      | OOM kill          | `pnpm exec turbo run test --concurrency=2` with heap cap |

Example persisted log (`.agents/setup-log/gates/example.log` — **`EXIT:` must be the last line**; run validate/prettier in separate files). Capture with a redirect (not `tee` in a pipeline — subshell drops `$code`):

```sh
LOG=.agents/setup-log/gates/example.log
mkdir -p "$(dirname "$LOG")"
{
  echo "CMD: pnpm exec turbo run typecheck --concurrency=2"
  echo "START: $(date -Iseconds)"
  pnpm exec turbo run typecheck --concurrency=2
  code=$?
  echo "END: $(date -Iseconds)"
  echo "EXIT:$code"
} > "$LOG" 2>&1
code=$(tail -1 "$LOG" | sed 's/^EXIT://')
case "$(tail -1 "$LOG")" in EXIT:[0-9]*) ;; *) echo "bad gate log"; false;; esac
# tail -n 20 "$LOG" to inspect; then exit "$code" or act on it
```

Shape on disk:

```text
CMD: pnpm exec turbo run typecheck --concurrency=2
START: 2026-11-04T10:00:00+00:00
… command stdout/stderr …
END: 2026-11-04T10:08:00+00:00
EXIT:0
```

- **Scores:** mean (8 axes) 2.6 — pass; owner-dependent: discovery 2, domain rules 2 (simulated owner cap). Measurable: personas 3, design 2, architecture 2, gates 2, skills 2, providers 2, UX 2, self-improvement 2. Depth axes: D1 reading 3, D2 domain and identity rules 2, D3 nested rules 2, D4 model routing 2. Evidence: `.agents/product.md`, `.agents/domain/booking.md`, `.agents/setup-log/reading.md`, transcript §3.
- **Decisions:** wire cursor + claude now, codex later (`source: owner`); keep the team's `.cursor/skills` folder, link kit skills inside it.
- **Kit frictions:** one draft per friction below (or: none this run)
- **Re-audit:** after the next release, or when product, domain rules, or providers change.

## Kit issue drafts from this run

Paste each draft into the kit tracker as its own issue. See `kit-issue.template.md` in this folder. **One draft per friction** with kit root cause filled.
