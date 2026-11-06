#!/usr/bin/env bash
# CI ESLint pass. Full path (FULL=true): the whole repo, which also smoke-tests
# the shared config. Affected path: only the files changed against
# origin/$BASE_REF, plus the whole repo when eslint.config.mjs itself changed.
# Extra arguments go to eslint (e.g. --cache).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

changed=""
if [ "${FULL:-}" != "true" ]; then
  changed=$(git diff --name-only --diff-filter=d --no-renames "origin/${BASE_REF:?BASE_REF required off the full path}"...HEAD)
fi

if [ "${FULL:-}" = "true" ] || printf '%s\n' "$changed" | grep -qx 'eslint.config.mjs'; then
  exec pnpm exec eslint . "$@"
fi

{ printf '%s\n' "$changed" | grep -E '\.(c|m)?(j|t)sx?$' || true; } |
  xargs -r pnpm exec eslint --no-warn-ignored "$@"
