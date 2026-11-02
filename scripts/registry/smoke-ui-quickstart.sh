#!/usr/bin/env bash
# CI: same copy-paste path as the home quickstart (apps/docs/home-quickstart/snippets).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SNIPPETS="${ROOT}/apps/docs/home-quickstart/snippets"
WORK="${TMPDIR:-/tmp}/zedkit-ui-quickstart-smoke-$$"

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

for f in install.sh npm-globals.css npm-page.tsx; do
  if [[ ! -f "${SNIPPETS}/${f}" ]]; then
    echo "smoke-ui-quickstart: missing ${SNIPPETS}/${f}" >&2
    exit 1
  fi
done

pnpm dlx "create-next-app@${CREATE_NEXT_APP_VERSION:-16.4.3}" "$WORK" \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes

cd "$WORK"
cp "${SNIPPETS}/npm-globals.css" src/app/globals.css
cp "${SNIPPETS}/npm-page.tsx" src/app/page.tsx
bash -c "$(cat "${SNIPPETS}/install.sh")"
pnpm exec next build

echo "smoke-ui-quickstart: ok (styled Button page built)"
