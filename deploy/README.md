# Docs hosting

The docs site (`apps/docs`) is a static export served by Caddy on a small
Linux VM with Docker. Caddy obtains and renews the TLS certificate
automatically and redirects `www.zedkit.app` to `zedkit.app`.

| File | Purpose |
|---|---|
| `Caddyfile` | Site config: apex + `www` redirect, caching, 404 page, suggest proxy, dev site |
| `compose.yaml` | Runs Caddy plus the identity-suggest Node service |
| `compose.override.yaml` | Repo-owned mounts for Caddy; replaces any hand wiring on the host |
| `compose.dev.yaml` | `suggest-dev`: the dev site's own suggest service (own code, env and ledger), started by `deploy.sh --dev` |
| `suggest/` | The identity suggest service: `POST /api/identity/suggest` (a brief and optional reference pages in, a validated identity patch out), free `GET /status` and `GET /version`. Provider keys stay on the server. See [Identity suggest service](#identity-suggest-service) |
| `deploy.sh` | Uploads a versioned release under `releases/<sha>`, switches the `current` symlink, reloads Caddy, and recreates Suggest when its fingerprint (every file it runs from, and its env) changes. `--rollback` restores the previous release pointer. With `--dev`: content to the dev site, stamped with `dev-build.txt`, and the dev site's own `suggest-dev` service; production's service and release pointer are untouched |

## Deploy by hand

```sh
pnpm install --frozen-lockfile
pnpm --filter @zedtech/zedkit-docs build
deploy/deploy.sh <user>@<host>
```

## Deploy from CI

`.github/workflows/deploy-docs.yml` builds and deploys on every push to
`main` that touches the docs or this directory.

`.github/workflows/deploy-dev.yml` builds and publishes to the dev site on
every push to `integration/visual` or `integration/visual-followup`, and on
manual dispatch for any other ref. Each dev deploy stamps `dev-build.txt`
(branch, commit, UTC build time); check it at
`https://dev.zedkit.app/dev-build.txt`. It also writes
`deploy/suggest-dev.env` from the secrets below and (re)starts `suggest-dev`.

Both workflows need the repository secrets `DOCS_DEPLOY_HOST`,
`DOCS_DEPLOY_USER`, `DOCS_DEPLOY_KEY` and `DOCS_DEPLOY_KNOWN_HOSTS`. Production
reads the identity secrets under their own names; dev reads the same provider
secrets (`IDENTITY_AI_BASE_URL`, `_API_KEY`, `_MODEL`, `_REASONING_EFFORT`) and
its own switch, budget and prices under `IDENTITY_AI_DEV_*`.

## Identity suggest service

Paid generation is **off** until an operator turns it on and approves a budget.
There is no default budget, no default price and no unlimited mode. The service
starts either way: it answers `GET /status` with `available: false` and a
reason (`disabled`, `not-configured`, `unavailable` or `killed`), and
`POST` returns `503` with that reason without touching the provider.

| Setting (secret) | Meaning | Default |
|---|---|---|
| `IDENTITY_AI_ENABLED` (`IDENTITY_AI_DEV_ENABLED` on dev) | Must be `1` | off |
| `IDENTITY_AI_BUDGET_DAILY_USD` | Approved spend ceiling per UTC day, in dollars | **required** |
| `IDENTITY_AI_BUDGET_MONTHLY_USD` | Optional ceiling per UTC month | none (the daily one still holds) |
| `IDENTITY_AI_PRICE_INPUT_USD_PER_MTOK`, `IDENTITY_AI_PRICE_OUTPUT_USD_PER_MTOK` | The model's price per million tokens: spend is computed from it | **required** |
| `IDENTITY_AI_BASE_URL`, `_API_KEY`, `_MODEL` | OpenAI-compatible chat completions origin (the contract the Muse route speaks). Never committed | required |
| `IDENTITY_AI_FALLBACK_*` and `IDENTITY_AI_FALLBACK_PRICE_*` | One optional second origin, tried once after a refusal or transport failure. Without prices it is off | none |
| `IDENTITY_AI_MAX_TOKENS` | Output tokens including reasoning | 4000, never above 8000; when `IDENTITY_AI_REASONING_EFFORT` is set, the service uses the full 8000 ceiling so the JSON answer is not starved |
| `IDENTITY_AI_TIMEOUT_MS` | Provider time per request | 150000, never above 180000 |
| `IDENTITY_AI_MAX_CONCURRENT` | Paid jobs running at once, across instances | 2, never above 8 |
| `IDENTITY_AI_IP_PER_MINUTE`, `_IP_PER_DAY`, `_SESSION_PER_DAY`, `_GLOBAL_PER_DAY` | Request limits per visitor address (an IPv6 visitor is its /64), per session cookie, and overall | 3, 20, 12, 300 |
| `IDENTITY_AI_NET_PER_DAY` | Per day for a whole IPv6 site (a /48): renting more /64s inside it buys nothing | 4 times the per-address day limit, never above 2000 |
| `IDENTITY_AI_GLOBAL_PER_HOUR` | Overall per hour, so no one actor spends the day's allowance in minutes | a quarter of the day limit, never above 2000 |
| `IDENTITY_AI_TRUSTED_PROXIES` | `private` or a comma list of IPs and CIDRs whose `X-Forwarded-For` is believed | none (compose sets `private`) |
| `IDENTITY_AI_STATE_DIR` | Where the ledger lives (a volume) | `/data` |

How it holds, and where to look:

- **The ledger** (`suggest/ledger.mjs`) is one SQLite file in `IDENTITY_AI_STATE_DIR`:
  spend per day and month, rate counters, running jobs, request ids. A call is
  admitted only after a reservation at its worst case commits atomically, so
  restarts and instances sharing the volume share one budget. A reservation
  is settled to the provider's reported usage, or kept whole when there is no
  report (timeout, cancelled visitor, crash) or when the report cannot be true
  (a prompt cannot cost fewer tokens than its bytes allow). The reservation
  counts UTF-8 bytes, which no tokenizer exceeds, so CJK and emoji are covered;
  the surplus goes back at settlement. A provider 5xx or 408 may have done the
  work, so it is charged; a 4xx or 429 did none. A refused request writes
  nothing, so the same request id can be retried once the limit has passed.
  Instances must share the same
  host volume; a multi-host deployment needs a network store behind the same
  interface.
- **Kill switch:** create the file `DISABLED` in the state volume
  (`docker compose exec suggest touch /data/DISABLED`). It is read on every
  request by every instance and takes effect at once; delete it to resume. To
  stop for good, clear `IDENTITY_AI_ENABLED`.
- **Reading spend:** every request logs one JSON line (`outcome`, `ms`,
  `costMicro`, `calls`, `refs`) and never a brief, a URL or an address.
  `sqlite3 /data/ledger.sqlite 'select * from spend'` shows the day and month.
- **References** (`suggest/references.mjs`): https only, no credentials or
  custom ports or IP literals, every resolved address must be public (checked
  inside the socket's own lookup, so a rebinding answer is refused at connect
  time), redirects re-checked, no cookies, no compression, byte and time caps.
  IPv6 is public only inside `2000::/3`. Pages are read as text in one linear
  pass (a page built to be slow costs time in proportion to its size) and are
  never visually analysed.
- **Connections:** the service gives a request 5 s for its headers and 10 s in
  all, and caps open connections; Caddy caps the body of a suggest request at
  32 KB and applies the same read deadlines. Caddy waits up to 240 s for Suggest
  to answer, above the 180 s provider ceiling plus the reference fetch.
  Containers run read-only with no capabilities, no new privileges, 512 MB and
  256 processes.
- **Secrets on the host:** each `releases/<sha>/suggest.env` is created
  `0600`, and all but the newest five releases (never the live one nor the one
  `--rollback` needs) are removed after a deploy (`DEPLOY_KEEP_RELEASES`).
  Known limit: a dev deploy still writes the Caddyfile into `current/`, because
  Caddy mounts that one path; it is validated first, and a rollback restores the
  release's own copy.
- **The schema** the service validates (`suggest/tokens.mjs`) is a port of
  `identityTokenSchema`; `tokens.parity.test.mjs` runs both on a seeded fuzz and
  fails on any disagreement. Run it after `pnpm --filter @zedtech/zedkit-ui build`.

## Requirements on the VM

Docker with Compose, `rsync`, ports 80/443 open (443 UDP for HTTP/3), and
`zedkit.app`, `www.zedkit.app`, and `dev.zedkit.app` resolving to the VM.

Other static files (for example registry JSON under `/r/`) are served from
the same site directory with the content type derived from their extension.
