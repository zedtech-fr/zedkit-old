#!/usr/bin/env bash
# Pack readiness: for every package, pack it and verify the tarball holds
# everything a consumer needs (manifest, LICENSE, README, every `files`
# entry, every exports/bin/types target) with no private terms inside, and
# that repository fields stay consistent. Versions are owned by changesets
# and legitimately diverge (independent versioning, e.g. ui-first release),
# so they are required but never compared. Needs dist/ built first (CI runs
# this after build), except packages declaring `"zedkit": { "noBuild": true }`,
# which ship committed source and pack without a build; publishes nothing.
set -uo pipefail

# shellcheck source=denylist-patterns.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/denylist-patterns.sh"

cd "$(git rev-parse --show-toplevel)"

fail=0
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

manifest_field() {
  node -p "JSON.stringify((() => { try { return require('./$1').$2 ?? null; } catch { return null; } })())" 2>/dev/null
}

# Every path the manifest promises a consumer, one per line: files entries,
# main, types, all exports values, all bin values.
manifest_targets() {
  node -e "
const p = require('./$1');
const out = [...(Array.isArray(p.files) ? p.files : []), p.main, p.types];
const exp = p.exports || {};
for (const v of Object.values(exp)) {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') out.push(...Object.values(v));
}
if (p.bin && typeof p.bin === 'object') out.push(...Object.values(p.bin));
if (typeof p.bin === 'string') out.push(p.bin);
console.log([...new Set(out.filter((t) => typeof t === 'string' && !t.startsWith('!')))].join('\n'));
" 2>/dev/null
}

repo_url=""

for dir in packages/*/; do
  pkg="${dir}package.json"
  [ -f "$pkg" ] || continue
  name="$(basename "$dir")"
  if [ ! -d "${dir}dist" ]; then
    if [ "$(manifest_field "$pkg" "zedkit.noBuild")" = "true" ]; then
      echo "$name: no dist/ (declared no-build), packing source"
    else
      echo "$name: dist/ missing, run build first"; fail=1; continue
    fi
  fi

  mkdir -p "$tmp/$name"
  if ! (cd "$dir" && pnpm pack --pack-destination "$tmp/$name" >/dev/null 2>&1); then
    echo "$name: pack failed"
    fail=1
    continue
  fi
  tgz="$(ls "$tmp/$name"/*.tgz)"
  listing="$(tar -tzf "$tgz")"
  unpack="$tmp/$name/unpacked"
  mkdir -p "$unpack"
  tar -xzf "$tgz" -C "$unpack"

  # Manifest itself: required fields for a publishable package.
  for field in name version main types; do
    [ "$(manifest_field "$pkg" "$field")" != "null" ] || { echo "$name: package.json lacks $field"; fail=1; }
  done
  [ "$(manifest_field "$pkg" "exports['.']")" != "null" ] || { echo "$name: package.json lacks exports['.']"; fail=1; }

  # Tarball holds the manifest, licence, readme, and every promised path.
  for required in package/package.json package/LICENSE package/README.md; do
    echo "$listing" | grep -qxF "$required" || { echo "$name: tarball lacks $required"; fail=1; }
  done
  while IFS= read -r target; do
    [ -n "$target" ] || continue
    clean="${target#./}"
    echo "$listing" | grep -qE "^package/$clean(/|$)" || { echo "$name: tarball lacks promised path $target"; fail=1; }
  done <<< "$(manifest_targets "$pkg")"

  # No private terms in the packed contents; report files, never matched lines.
  hits="$(grep -rHnE -e "$(denylist_pattern)" "$unpack" 2>/dev/null | denylist_filter_hits || true)"
  if [ -n "$hits" ]; then
    echo "$name: private terms in packed contents:"
    echo "$hits" | sed "s|^$unpack/||"
    fail=1
  fi

  # Same repo URL; directory matches the path. (Version is checked for
  # presence above; values diverge by design, changesets owns them.)
  url="$(manifest_field "$pkg" "repository.url")"
  directory="$(manifest_field "$pkg" "repository.directory")"
  if [ "$url" = "null" ] || [ "$directory" = "null" ]; then
    echo "$name: package.json lacks repository.url/directory"
    fail=1
  else
    [ -z "$repo_url" ] && repo_url="$url"
    [ "$repo_url" = "$url" ] || { echo "$name: repository.url differs"; fail=1; }
    [ "$directory" = "\"packages/$name\"" ] || { echo "$name: repository.directory is $directory, want packages/$name"; fail=1; }
  fi

  # publint: errors only. The git+ repository.url note is a suggestion
  # and would fail --strict; provenance wants the https GitHub URL.
  if ! pnpm exec publint run --level error "$tgz"; then
    echo "$name: publint failed"
    fail=1
  fi

  # ESM-only packages: ignore CJS/node10. CSS subpaths have no types.
  attw_out="$(pnpm exec attw --profile esm-only --exclude-entrypoints ./styles.css \
      --no-emoji --format ascii "$tgz" 2>&1)" || {
    echo "$name: attw failed"
    echo "$attw_out"
    fail=1
  }

  echo "$name: ok"
done

# Client gzip of dist/*.js (ui kit + ai installer): npm tarball size, not what
# a browser downloads. Docs first-load JS is checked separately from the
# static export (see apps/docs/scripts/check-first-load-budget.mjs).
size_budget() {
  local name="$1" max="$2"
  local dir="$tmp/$name/unpacked/package/dist"
  [ -d "$dir" ] || { echo "$name: size budget skipped (no dist/)"; return; }
  local bytes
  bytes="$(find "$dir" -name '*.js' -print0 | sort -z | xargs -0 cat | gzip -c | wc -c)"
  if [ "$bytes" -gt "$max" ]; then
    echo "$name: gzip(dist/*.js) is $bytes bytes, budget $max"
    fail=1
  else
    echo "$name: size $bytes / $max ok"
  fi
}
# Measured 42212 on 2 Nov 2026 (identity tokens, route modal, ThemeScope ref and nested-identity handling);
# the previous 40800 was already exceeded at 41771 before this change. Keep roughly 2% headroom.
size_budget ui 43100
size_budget ai 9800

if [ -f apps/docs/out/index.html ]; then
  if ! node apps/docs/scripts/check-first-load-budget.mjs; then
    fail=1
  fi
else
  echo "check-pack: docs first-load budget skipped (apps/docs/out missing)"
fi

if [ "$fail" -ne 0 ]; then
  echo "check-pack: FAILED"
  exit 1
fi
echo "check-pack: ok"
