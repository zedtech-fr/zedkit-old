#!/usr/bin/env bash
# Fails if any docs Playwright spec is registered in neither the smoke
# nor the e2e script (orphan specs silently never run in CI).
set -uo pipefail

cd "$(dirname "$0")/.."

specs=$(ls apps/docs/tests/*.spec.ts)
blob=$(node -e "const p=require('./apps/docs/package.json'); console.log([p.scripts.smoke,p.scripts.e2e,p.scripts['e2e:routes']].join(' '))")
fail=0
for spec in $specs; do
  name=$(basename "$spec")
  case "$blob" in
    *"$name"*) ;;
    *) echo "orphan spec (not in smoke or e2e): $spec"; fail=1 ;;
  esac
done
[ "$fail" -eq 0 ] && echo "e2e-registered: ok"
exit "$fail"
