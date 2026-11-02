# Shared helpers for scripts/release-tags.sh (source, do not execute alone).

npm_view_version() {
  local spec="$1"
  local npm_view="${RELEASE_TAGS_NPM_VIEW:-npm view}"
  local limit="${RELEASE_TAGS_NPM_VIEW_TIMEOUT_SEC:-60}"
  timeout "$limit" $npm_view "$spec" version >/dev/null 2>&1
}

# Poll until npm view sees pkg@version (registry propagation after publish).
# Env: RELEASE_TAGS_NPM_VIEW (default: npm view), RELEASE_TAGS_NPM_MAX_ATTEMPTS (10),
# RELEASE_TAGS_NPM_SLEEP_SEC (base sleep, default 5 — scaled per attempt up to ~5m total).
wait_for_npm_version() {
  local spec="$1"
  local max_attempts="${RELEASE_TAGS_NPM_MAX_ATTEMPTS:-10}"
  local base_sleep="${RELEASE_TAGS_NPM_SLEEP_SEC:-5}"
  local attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    if npm_view_version "$spec"; then
      return 0
    fi
    if [ "$attempt" -eq "$max_attempts" ]; then
      echo "error: npm registry: $spec not visible after $max_attempts attempts (waited up to ~5m)" >&2
      return 1
    fi
    local sleep_for=$((base_sleep * attempt))
    echo "wait npm $spec (attempt $attempt/$max_attempts, ${sleep_for}s)..."
    sleep "$sleep_for"
    attempt=$((attempt + 1))
  done
  return 1
}

git_push_tag() {
  local tag="$1"
  local limit="${RELEASE_TAGS_GIT_PUSH_TIMEOUT_SEC:-120}"
  timeout "$limit" git push origin "refs/tags/$tag"
}

gh_release_create() {
  local tag="$1" title="$2" notes="$3"
  local limit="${RELEASE_TAGS_GH_RELEASE_TIMEOUT_SEC:-120}"
  # Non-interactive: no editor, no prompts (CI has no TTY).
  timeout "$limit" gh release create "$tag" --verify-tag --title "$title" --notes "$notes"
}
