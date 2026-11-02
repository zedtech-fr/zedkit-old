#!/usr/bin/env bash
# Fails if secrets (or a committable .env) are tracked by git.
set -uo pipefail

usage() {
  cat <<'EOF'
Usage: zedkit-check-no-secrets
Fails if a tracked .env (other than .env.example) or a high-signal secret pattern is in git.
EOF
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  usage
  exit 0
fi
if [ $# -gt 0 ]; then
  echo "check-no-secrets: unknown argument $1" >&2
  usage >&2
  exit 2
fi

if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "check-no-secrets: not a git repository" >&2
  exit 1
fi
cd "$root"

fail=0

# 1. .env files (except the example) must never be tracked.
tracked_env=$(git ls-files | grep -E '(^|/)\.env($|\..*)' | grep -v '\.env\.example$' || true)
if [ -n "$tracked_env" ]; then
  echo "tracked env files (only .env.example may be committed):"
  echo "$tracked_env"
  fail=1
fi

# 2. High-signal secret patterns in tracked contents.
# pnpm-lock.yaml is excluded: integrity hashes are random base64 and will
# eventually match any short pattern (it cannot carry a prose secret).
patterns='BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]+|sk-live-[A-Za-z0-9]{8,}'
hits=$(git grep -inE -e "$patterns" -- . ':!pnpm-lock.yaml' || true)
if [ -n "$hits" ]; then
  echo "possible secrets in tracked files:"
  echo "$hits"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "check-no-secrets: FAILED"
  exit 1
fi
echo "check-no-secrets: ok"
