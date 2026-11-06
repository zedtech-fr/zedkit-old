#!/usr/bin/env bash
# Fails if any docs Playwright spec is registered in neither the smoke
# nor the e2e script (orphan specs silently never run in CI).
# Specs resolve against playwright.config.ts baseURL; an origin in a spec
# fights whatever is already on :3100. SPECS_DIR overrides the origin scan
# root (tests).
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

specs_dir=${SPECS_DIR:-apps/docs/tests}
for f in "$specs_dir"/*.ts; do
  [ -f "$f" ] || continue
  hits=$(grep -nE '127\.0\.0\.1|localhost:' "$f" || true)
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      echo "spec origin (use a relative path; origin lives in playwright.config.ts): $f:$line"
    done <<< "$hits"
    fail=1
  fi
done

[ "$fail" -eq 0 ] && echo "e2e-registered: ok"
exit "$fail"
