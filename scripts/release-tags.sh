#!/usr/bin/env bash
# Push a git tag and create a GitHub release for packages changesets just
# published. Idempotent: existing tags and releases are left untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=release-tags-lib.sh
source "$ROOT/scripts/release-tags-lib.sh"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h | --help)
      echo "usage: release-tags.sh [--dry-run]"
      echo "  CI sets RELEASE_TAGS_PUBLISHED (JSON from changesets/action publishedPackages)."
      exit 0
      ;;
    *)
      echo "unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

tag_one() {
  local name="$1" version="$2"
  local tag="$name@$version"
  local pkg_dir=""
  for candidate in packages/*/package.json; do
    if [ "$(jq -r '.name' "$candidate")" = "$name" ]; then
      pkg_dir=$(dirname "$candidate")
      break
    fi
  done
  if [ -z "$pkg_dir" ]; then
    echo "skip $tag (no package.json on disk)"
    return 0
  fi
  if ! wait_for_npm_version "$tag"; then
    echo "skip $tag (not on npm yet)"
    return 0
  fi
  if ! timeout 60 git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null 2>&1; then
    if [ "$DRY_RUN" = "1" ]; then
      echo "dry-run: would push tag $tag"
    else
      git tag "$tag" 2>/dev/null || true
      git_push_tag "$tag"
      echo "pushed tag $tag"
    fi
  fi
  if ! timeout 30 gh release view "$tag" >/dev/null 2>&1; then
    local changelog="$pkg_dir/CHANGELOG.md"
    local notes=""
    if [ -f "$changelog" ]; then
      notes=$(awk -v v="$version" '
        $0 == "## " v { on = 1; next }
        on && /^## / { exit }
        on { print }' "$changelog")
    fi
    [ -n "$notes" ] || notes="$tag"
    if [ "$DRY_RUN" = "1" ]; then
      echo "dry-run: would create release $tag"
    else
      gh_release_create "$tag" "$tag" "$notes"
      echo "created release $tag"
    fi
  fi
}

# CI: only packages published in this run (avoids ~5m npm poll × every public package).
if [ -n "${RELEASE_TAGS_PUBLISHED:-}" ]; then
  count=$(echo "$RELEASE_TAGS_PUBLISHED" | jq 'length')
  if [ "$count" -eq 0 ]; then
    echo "release-tags: publishedPackages empty, nothing to do"
    exit 0
  fi
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    name="${line%%|*}"
    version="${line##*|}"
    tag_one "$name" "$version"
  done < <(echo "$RELEASE_TAGS_PUBLISHED" | jq -r '.[] | "\(.name)|\(.version)"')
  exit 0
fi

# Local dry-run / legacy: scan package.json (fast-fail npm with RELEASE_TAGS_NPM_MAX_ATTEMPTS=1).
for pkg in packages/*/package.json; do
  name=$(jq -r '.name' "$pkg")
  version=$(jq -r '.version' "$pkg")
  private=$(jq -r '.private // false' "$pkg")
  [ "$private" = "true" ] && continue
  tag_one "$name" "$version"
done
