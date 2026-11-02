#!/usr/bin/env bash
# R17: committed registry/ui must match `pnpm registry:build` output.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

pnpm registry:build

if git diff --quiet -- registry/ui; then
  echo "check-registry-ui-drift: ok"
  exit 0
fi

echo "check-registry-ui-drift: registry/ui is out of date (run pnpm registry:build and commit registry/ui)" >&2
git diff --stat -- registry/ui >&2
exit 1
