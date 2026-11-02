#!/usr/bin/env bash
# Fails if build artifacts, caches, or oversized files are tracked by git.
# Default directory/file lists are a superset of common JS/TS ignore entries;
# pass --dirs / --files / --allow (repeatable) to add repo-specific patterns.
# --no-index is required: without it check-ignore stays silent on tracked
# files, so that step could never fire.
set -uo pipefail

usage() {
  cat <<'EOF'
Usage: zedkit-check-no-artifacts [--dirs REGEX] [--files REGEX] [--allow REGEX] [--max-bytes N]
Fails if tracked files match known artifact paths, match .gitignore, or exceed --max-bytes.
--dirs, --files, and --allow append to the defaults (repeatable). Env extras:
ZEDKIT_ARTIFACT_DIRS, ZEDKIT_ARTIFACT_FILES, ZEDKIT_ARTIFACT_ALLOW, ZEDKIT_ARTIFACT_MAX_BYTES.
EOF
}

need_value() {
  if [ -z "${2:-}" ] || [[ "${2}" == -* ]]; then
    echo "check-no-artifacts: $1 needs a value" >&2
    usage >&2
    exit 2
  fi
}

if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "check-no-artifacts: not a git repository" >&2
  exit 1
fi
cd "$root"

dirs_extra=()
files_extra=()
allow_extra=()
max_bytes="${ZEDKIT_ARTIFACT_MAX_BYTES:-204800}"
[ -n "${ZEDKIT_ARTIFACT_DIRS:-}" ] && dirs_extra+=("${ZEDKIT_ARTIFACT_DIRS}")
[ -n "${ZEDKIT_ARTIFACT_FILES:-}" ] && files_extra+=("${ZEDKIT_ARTIFACT_FILES}")
[ -n "${ZEDKIT_ARTIFACT_ALLOW:-}" ] && allow_extra+=("${ZEDKIT_ARTIFACT_ALLOW}")

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --dirs)
      need_value "$1" "${2:-}"
      dirs_extra+=("$2")
      shift 2
      ;;
    --files)
      need_value "$1" "${2:-}"
      files_extra+=("$2")
      shift 2
      ;;
    --allow)
      need_value "$1" "${2:-}"
      allow_extra+=("$2")
      shift 2
      ;;
    --max-bytes)
      need_value "$1" "${2:-}"
      max_bytes="$2"
      shift 2
      ;;
    *)
      echo "check-no-artifacts: unknown argument $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

join_regex() {
  local acc="$1"
  shift
  local extra
  for extra in "$@"; do
    [ -n "$extra" ] || continue
    if [ -n "$acc" ]; then
      acc="${acc}|${extra}"
    else
      acc="$extra"
    fi
  done
  printf '%s' "$acc"
}

# 1. Known build-output / cache paths must never be tracked.
artifact_dirs=$(join_regex \
  'node_modules|\.next|dist|build|coverage|\.vitest|\.turbo|\.pnpm-store|\.vercel|test-results|playwright-report|blob-report|temp' \
  "${dirs_extra[@]+"${dirs_extra[@]}"}")
artifact_files=$(join_regex \
  '(\.tsbuildinfo|\.pack(\.gz)?)$|(^|/)next-env\.d\.ts$|chromium-darwin\.png$' \
  "${files_extra[@]+"${files_extra[@]}"}")
allowlisted=$(join_regex \
  '^(pnpm-lock\.yaml)$' \
  "${allow_extra[@]+"${allow_extra[@]}"}")

fail=0

# Group the dir alternation: without parens, `(^|/)${dirs}/` binds
# `(^|/)` only to the first name and `/` only to the last, so `build`
# matches `tsconfig.build.json` instead of a `build/` directory.
artifacts=$(git ls-files | grep -E "(^|/)(${artifact_dirs})/|${artifact_files}" || true)
if [ -n "$artifacts" ]; then
  echo "tracked build artifacts (see .gitignore):"
  echo "$artifacts"
  fail=1
fi

# 2. Nothing tracked may match .gitignore (catches force-added ignores).
ignored_but_tracked=$(git ls-files | git check-ignore --stdin --no-index || true)
if [ -n "$ignored_but_tracked" ]; then
  echo "tracked files that match .gitignore:"
  echo "$ignored_but_tracked"
  fail=1
fi

# 3. No tracked file over 200KB (caches and binaries cannot sneak in under
# an innocent name). If a legitimate file ever exceeds this, allowlist it
# with --allow — never by raising the limit silently.
while IFS= read -r -d '' file; do
  [ -f "$file" ] || continue
  if [[ "$file" =~ $allowlisted ]]; then continue; fi
  size=$(wc -c <"$file")
  if [ "$size" -gt "$max_bytes" ]; then
    echo "tracked file over ${max_bytes} bytes: $file ($size bytes)"
    fail=1
  fi
done < <(git ls-files -z)

if [ "$fail" -ne 0 ]; then
  echo "check-no-artifacts: FAILED"
  exit 1
fi
echo "check-no-artifacts: ok"
