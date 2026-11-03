# AGENTS.md — @zedtech/zedkit-payload-access

Default-deny role grants compiled to Payload `Access` functions.
`payload` is a peer dependency (types only, no runtime import).

Rules:

- Roles and grants are always passed in. Never hard-code a role or a
  grant list here; the only default is the anonymous pseudo-role name
  `"public"`, and callers can override it.
- New code goes in `src/`, tests in `tests/unit/` (plain vitest; call
  the compiled access functions with a fake `{ req: { user } }`, never
  boot Payload).
- Keep the matcher default-deny and resource-scoped.
- Every public export gets a `## <need>` entry in CATALOG.md (format in
  `docs/catalog/README.md`), then run `pnpm catalog:build` from the root.
- Public repo: generic wording only, no private project names anywhere
  (CI denylist enforces it).
