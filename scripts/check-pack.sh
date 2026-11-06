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
  # Here-strings, not `echo | grep -q`: with pipefail, grep exiting at the first match
  # can SIGPIPE echo on a large listing and report a path as missing.
  for required in package/package.json package/LICENSE package/README.md; do
    grep -qxF "$required" <<< "$listing" || { echo "$name: tarball lacks $required"; fail=1; }
  done
  while IFS= read -r target; do
    [ -n "$target" ] || continue
    clean="${target#./}"
    grep -qE "^package/$clean(/|$)" <<< "$listing" || { echo "$name: tarball lacks promised path $target"; fail=1; }
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
  attw_out="$(pnpm exec attw --profile esm-only --exclude-entrypoints ./styles.css --exclude-entrypoints ./motion.css \
      --no-emoji --format ascii "$tgz" 2>&1)" || {
    echo "$name: attw failed"
    echo "$attw_out"
    fail=1
  }

  echo "$name: ok"
done

# Client gzip of dist/*.js for the ui kit: npm tarball size, not what a
# browser downloads. Docs first-load JS is checked separately from the
# static export (see apps/docs/scripts/check-first-load-budget.mjs).
# @zedtech/zedkit-ai has no gzip ceiling: it is a CLI and kit installer,
# not a browser payload. Pack still checks integrity, exports, contents.
# Optional third argument: a subdirectory of dist/ to measure on its own
# (ui: dist/marketing). The main budget then leaves that subdirectory out.
size_budget() {
  local name="$1" max="$2" sub="${3:-}"
  local dir="$tmp/$name/unpacked/package/dist"
  [ -d "$dir" ] || { echo "$name: size budget skipped (no dist/)"; return; }
  local bytes label="$name"
  if [ -n "$sub" ]; then
    [ -d "$dir/$sub" ] || { echo "$name/$sub: size budget skipped (no dist/$sub)"; return; }
    label="$name/$sub"
    bytes="$(find "$dir/$sub" -name '*.js' -print0 | sort -z | xargs -0 cat | gzip -c | wc -c)"
  else
    bytes="$(find "$dir" -name '*.js' -not -path "$dir/marketing/*" -print0 | sort -z | xargs -0 cat | gzip -c | wc -c)"
  fi
  if [ "$bytes" -gt "$max" ]; then
    echo "$label: gzip(dist/*.js) is $bytes bytes, budget $max"
    fail=1
  else
    echo "$label: size $bytes / $max ok"
  fi
}
# Raised from 43500 to 44500 on 4 Nov 2026: measured 44141 with ScrollReset (route scroll reset).
# Raised to 45500 on 4 Nov 2026 after syncing main: signature type-role and motion exports on top of ScrollReset.
# IdentityDock chrome + vaul sheet moved to apps/docs (4 Nov 2026); ui gzip measured 44660.
# Raised to 48000 on 4 Nov 2026: Animate runtime + types (measured 46973).
# Raised to 56000 on 4 Nov 2026 (measured 54172 in CI): approved by the maintainers
# raising size budgets now and optimising later; trim tracked in issue 1398
# (identity-tokens, splitting the Animate runtime).
# Raised to 58000 on 5 Nov 2026 (measured 57331 in CI on ship #1446): ParallaxSection/
# ParallaxLayer on the motion subpath; trim still tracked in issue 1398.
# Raised to 60500 on 5 Nov 2026 (measured 59132 locally): StreamStatus, StreamText,
# and assistant SSE helpers on the main entry; trim still tracked in issue 1398.
# Raised to 60600 on 6 Nov 2026: same UI sources measure 60450 gzip on
# ubuntu-latest (dev tip 33e05b87) but 60530 on self-hosted/Dedibox after a
# clean tsc rebuild — toolchain emit variance, not a source growth. Headroom
# keeps the razor-thin ceiling from flaking; trim still tracked in issue 1398.
size_budget ui 60600
# Marketing entry (separate from the main budget); measured 785 with GlassSurface only;
# 9865 with L2 domain specimens plus goal/reference marketing sections (Hero, Pricing, …);
# 10020 after specimen-primitives barrel; tokenized keyword routing measured 10084 gzip.
size_budget ui 10200 marketing

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
