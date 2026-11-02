#!/usr/bin/env bash
# Fails if build artifacts, caches, or oversized files are tracked by git.
# Mirrors .gitignore's build section so the two cannot drift silently: if you
# extend one, extend the other.
set -uo pipefail

fail=0

# 1. Known build-output / cache paths must never be tracked.
artifact_dirs='(node_modules|\.next|dist|build|coverage|\.vitest|\.turbo|\.pnpm-store|\.vercel|test-results|playwright-report|blob-report|temp)'
artifact_files='(\.tsbuildinfo|\.pack(\.gz)?)$|(^|/)next-env\.d\.ts$|chromium-darwin\.png$'
artifacts=$(git ls-files | grep -E "(^|/)${artifact_dirs}/|${artifact_files}" || true)
if [ -n "$artifacts" ]; then
  echo "tracked build artifacts (see .gitignore):"
  echo "$artifacts"
  fail=1
fi

# 2. Nothing tracked may match .gitignore (catches force-added ignores).
# --no-index is required: without it check-ignore stays silent on tracked
# files, so this step could never fire.
ignored_but_tracked=$(git ls-files | git check-ignore --stdin --no-index || true)
if [ -n "$ignored_but_tracked" ]; then
  echo "tracked files that match .gitignore:"
  echo "$ignored_but_tracked"
  fail=1
fi

# 3. No tracked file over 200KB (caches and binaries cannot sneak in under
# an innocent name). If a legitimate file ever exceeds this, allowlist it
# explicitly here with a comment — never by raising the limit silently.
limit=204800
# Allowlist: the lockfile is required for frozen installs and grows with
# the catalog; it is reviewed as text, not a binary or cache. The catalog
# JSON is generated from the package CATALOG.md files, diffed in review,
# and crossed 200KB as needs accumulated — same reasoning.
allowlisted='^(pnpm-lock\.yaml|docs/catalog/catalog\.json)$'
while IFS= read -r -d '' file; do
  [ -f "$file" ] || continue
  if [[ "$file" =~ $allowlisted ]]; then continue; fi
  size=$(wc -c <"$file")
  if [ "$size" -gt "$limit" ]; then
    echo "tracked file over 200KB: $file ($size bytes)"
    fail=1
  fi
done < <(git ls-files -z)

if [ "$fail" -ne 0 ]; then
  echo "check-no-artifacts: FAILED"
  exit 1
fi
echo "check-no-artifacts: ok"
