#!/usr/bin/env bash
# Self-hosted runner local caches (host volume /runner-cache).
# Safe for concurrent ephemeral runners: archives are extracted per job into
# the workspace (new inodes). The pnpm store is content-addressed and shared
# read-mostly; installs use --offline/--prefer-offline against it.
# Never print secrets. Fork PRs never reach this runner (workflow if-guard).
set -euo pipefail

CACHE_ROOT="${RUNNER_CACHE_ROOT:-/runner-cache}"
PNPM_STORE="${CACHE_ROOT}/pnpm"
NM_DIR="${CACHE_ROOT}/nm"
TS_DIR="${CACHE_ROOT}/tsbuildinfo"
ESLINT_DIR="${CACHE_ROOT}/eslint"
TURBO_DIR="${CACHE_ROOT}/turbo"
PLAYWRIGHT_IMAGE_DIR="${PLAYWRIGHT_BROWSERS_PATH:-/opt/ms-playwright}"

mkdir -p "$PNPM_STORE" "$NM_DIR" "$TS_DIR" "$ESLINT_DIR" "$TURBO_DIR" \
  "${CACHE_ROOT}/npm" "${CACHE_ROOT}/xdg"

lock_hash() {
  sha256sum pnpm-lock.yaml | awk "{print \$1}"
}

cmd="${1:?usage: ci-runner-cache.sh <prepare|install|save-nm|restore-ts|save-ts|eslint-args|playwright|disk-report>}"

case "$cmd" in
  prepare)
    echo "cache root: $CACHE_ROOT"
    du -sh "$CACHE_ROOT"/* 2>/dev/null || true
    ;;

  install)
    hash="$(lock_hash)"
    archive="${NM_DIR}/${hash}.tar.gz"
    hit=0
    if [[ -f "$archive" ]]; then
      echo "node_modules cache HIT (${hash:0:12})"
      # Extract into workspace; creates private inodes (not shared with peers).
      tar -xzf "$archive"
      hit=1
    else
      echo "node_modules cache MISS (${hash:0:12})"
    fi
    export npm_config_store_dir="$PNPM_STORE"
    # Stale *.tsbuildinfo must not survive into package postinstall tsc: incremental
    # would no-op while dist/ is absent (nm archive only stores node_modules).
    find . -name "*.tsbuildinfo" -not -path "./node_modules/*" -delete 2>/dev/null || true
    if [[ "$hit" -eq 1 ]]; then
      if ! pnpm install --frozen-lockfile --store-dir "$PNPM_STORE" --prefer-offline; then
        echo "nm archive install failed; invalidating archive and reinstalling"
        rm -f "$archive"
        rm -rf node_modules
        find apps packages -type d -name node_modules -prune -exec rm -rf {} + 2>/dev/null || true
        hit=0
        pnpm install --frozen-lockfile --store-dir "$PNPM_STORE" --prefer-offline
      fi
    else
      pnpm install --frozen-lockfile --store-dir "$PNPM_STORE" --prefer-offline
    fi
    if [[ "$hit" -eq 0 ]]; then
      # Atomic save under flock so concurrent cold jobs do not clobber.
      (
        flock 9
        if [[ ! -f "$archive" ]]; then
          echo "saving node_modules archive ${hash:0:12}"
          {
            printf "%s\0" node_modules
            find apps packages -type d -name node_modules -prune -print0 2>/dev/null || true
          } | tar -czf "${archive}.tmp" --null -T -
          mv -f "${archive}.tmp" "$archive"
        fi
      ) 9>"${NM_DIR}/.lock"
    fi
    echo "NM_HASH=${hash}" >> "${GITHUB_ENV:-/dev/null}"
    echo "hash=${hash}" >> "${GITHUB_OUTPUT:-/dev/null}"
    ;;
  restore-ts)
    # Rolling latest archive: stale buildinfo is safe (tsc regenerates).
    latest="${TS_DIR}/latest.tar.gz"
    if [[ -f "$latest" ]]; then
      echo "restoring tsbuildinfo from host cache"
      tar -xzf "$latest" 2>/dev/null || true
    else
      echo "no tsbuildinfo cache yet"
    fi
    ;;

  save-ts)
    (
      flock 9
      mapfile -t files < <(find . -name "*.tsbuildinfo" -not -path "./node_modules/*" 2>/dev/null || true)
      if [[ "${#files[@]}" -eq 0 ]]; then
        echo "no tsbuildinfo files to save"
        exit 0
      fi
      tar -czf "${TS_DIR}/latest.tar.gz.tmp" "${files[@]}"
      mv -f "${TS_DIR}/latest.tar.gz.tmp" "${TS_DIR}/latest.tar.gz"
      echo "saved ${#files[@]} tsbuildinfo files"
    ) 9>"${TS_DIR}/.lock"
    ;;

  eslint-args)
    # Print args for eslint invocation (cache on host volume).
    printf -- "--cache --cache-location %s/.eslintcache" "$ESLINT_DIR"
    ;;

  playwright)
    # Prefer browsers baked into the image; only install if missing.
    if [[ -d "$PLAYWRIGHT_IMAGE_DIR" ]] && find "$PLAYWRIGHT_IMAGE_DIR" \( -type f -name chrome -o -type f -name chromium -o -type f -name chrome-headless-shell \) 2>/dev/null | grep -q .; then
      echo "Playwright browsers present at $PLAYWRIGHT_IMAGE_DIR (image/cache); skip download"
      echo "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1" >> "${GITHUB_ENV:-/dev/null}"
      exit 0
    fi
    echo "Playwright browsers missing at $PLAYWRIGHT_IMAGE_DIR; installing chromium once into cache"
    mkdir -p "$PLAYWRIGHT_IMAGE_DIR"
    pnpm exec playwright install chromium
    ;;

  disk-report)
    echo "=== /runner-cache disk ==="
    df -h "$CACHE_ROOT" || true
    du -sh "$CACHE_ROOT"/* 2>/dev/null || true
    ;;

  *)
    echo "unknown command: $cmd" >&2
    exit 2
    ;;
esac
