#!/usr/bin/env bash
# Persona / CI evidence: install Badge from built registry JSON into a fresh
# Next app and compile. Requires network (create-next-app, npm deps).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${ROOT}/apps/docs/public/r"
WORK="${TMPDIR:-/tmp}/zedkit-registry-smoke-$$"
SHADCN="${SHADCN_VERSION:-4.22.1}"

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

for item in theme badge drawer confirm-dialog dialog; do
  if [[ ! -f "${OUT}/${item}.json" ]]; then
    echo "smoke-shadcn-add: missing ${OUT}/${item}.json (run pnpm registry:build)" >&2
    exit 1
  fi
done

pnpm dlx "create-next-app@${CREATE_NEXT_APP_VERSION:-16.4.3}" "$WORK" \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes

cd "$WORK"
pnpm dlx "shadcn@${SHADCN}" init -d
pnpm dlx "shadcn@${SHADCN}" registry add "@zedkit=${OUT}/{name}.json"
pnpm dlx "shadcn@${SHADCN}" add "${OUT}/theme.json" "${OUT}/badge.json" "${OUT}/drawer.json" "${OUT}/confirm-dialog.json" "${OUT}/dialog.json" -y
pnpm exec next build

echo "smoke-shadcn-add: ok (theme, badge, drawer, confirm-dialog, dialog installed, next build)"
