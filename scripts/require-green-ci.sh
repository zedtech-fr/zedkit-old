#!/usr/bin/env bash
# Wait until workflow "ci" / job "ci-required" succeeded on this commit.
# Fail closed: missing inputs, no run before timeout, a completed non-success
# run with nothing still in flight, or a missing/non-success ci-required job.
set -euo pipefail

SHA="${GITHUB_SHA:-}"
REPO="${GITHUB_REPOSITORY:-}"
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
WORKFLOW="${REQUIRE_CI_WORKFLOW:-ci}"
JOB="${REQUIRE_CI_JOB:-ci-required}"
POLL="${REQUIRE_CI_POLL_SECONDS:-15}"
TIMEOUT="${REQUIRE_CI_TIMEOUT_SECONDS:-2700}"
GH_BIN="${GH_BIN:-gh}"
SLEEP_BIN="${REQUIRE_CI_SLEEP:-sleep}"

fail() {
  echo "require-green-ci: $*" >&2
  exit 1
}

if [ -z "$SHA" ]; then
  fail "missing GITHUB_SHA"
fi
if [ -z "$REPO" ]; then
  fail "missing GITHUB_REPOSITORY"
fi
if [ -z "$TOKEN" ]; then
  fail "missing GH_TOKEN (or GITHUB_TOKEN)"
fi

export GH_TOKEN="$TOKEN"

CLASSIFY_PY=$(cat <<'PY'
import json, sys

sha = sys.argv[1]
try:
    runs = json.load(sys.stdin)
except Exception:
    print("error")
    raise SystemExit(0)
if not isinstance(runs, list):
    print("error")
    raise SystemExit(0)

matched = []
for run in runs:
    head = run.get("headSha")
    if head and head != sha:
        continue
    matched.append(run)
matched.sort(key=lambda run: run.get("createdAt") or "", reverse=True)

def is_done(run):
    return run.get("status") == "completed"

ok = [run for run in matched if is_done(run) and run.get("conclusion") == "success"]
red = [run for run in matched if is_done(run) and run.get("conclusion") != "success"]
pending = [run for run in matched if not is_done(run)]

if ok:
    run = ok[0]
    print("ok", run.get("databaseId") or "", run.get("url") or "")
elif pending:
    print("wait")
elif red:
    run = red[0]
    print("red", run.get("databaseId") or "", run.get("conclusion") or "unknown", run.get("url") or "")
else:
    print("none")
PY
)

JOB_PY=$(cat <<'PY'
import json, sys

name = sys.argv[1]
try:
    data = json.load(sys.stdin)
except Exception:
    print("error")
    raise SystemExit(0)
jobs = data.get("jobs") if isinstance(data, dict) else None
if not isinstance(jobs, list):
    print("error")
    raise SystemExit(0)
found = next((job for job in jobs if job.get("name") == name), None)
if found is None:
    print("missing")
    raise SystemExit(0)
print(found.get("conclusion") or found.get("status") or "unknown")
PY
)

list_runs() {
  "$GH_BIN" run list \
    --repo "$REPO" \
    --workflow "$WORKFLOW" \
    --commit "$SHA" \
    --limit 20 \
    --json databaseId,status,conclusion,event,headSha,createdAt,workflowName,url
}

view_jobs() {
  local id="$1"
  "$GH_BIN" run view "$id" --repo "$REPO" --json jobs
}

classify() {
  python3 -c "$CLASSIFY_PY" "$SHA"
}

job_conclusion() {
  local id="$1"
  view_jobs "$id" | python3 -c "$JOB_PY" "$JOB"
}

start="$(date +%s)"
while true; do
  if ! raw="$(list_runs)"; then
    state="error"
  else
    state="$(printf '%s\n' "$raw" | classify)"
  fi
  # shellcheck disable=SC2086
  set -- $state
  kind="${1:-error}"

  if [ "$kind" = "ok" ]; then
    run_id="${2:-}"
    run_url="${3:-}"
    if [ -z "$run_id" ]; then
      fail "workflow \"$WORKFLOW\" reported success without a run id"
    fi
    if ! conclusion="$(job_conclusion "$run_id")"; then
      conclusion="error"
    fi
    if [ "$conclusion" = "success" ]; then
      echo "require-green-ci: workflow \"$WORKFLOW\" run $run_id job \"$JOB\" succeeded${run_url:+ at $run_url}"
      exit 0
    fi
    fail "job \"$JOB\" on run $run_id conclusion is ${conclusion} (need success)${run_url:+ at $run_url}"
  fi

  if [ "$kind" = "red" ]; then
    run_id="${2:-unknown}"
    conclusion="${3:-unknown}"
    run_url="${4:-}"
    fail "workflow \"$WORKFLOW\" run $run_id conclusion is ${conclusion} (need success)${run_url:+ at $run_url}"
  fi

  now="$(date +%s)"
  elapsed="$((now - start))"
  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    if [ "$kind" = "none" ]; then
      fail "timed out waiting for workflow \"$WORKFLOW\" on $SHA"
    fi
    fail "timed out waiting for workflow \"$WORKFLOW\" on $SHA (last state: $kind)"
  fi
  "$SLEEP_BIN" "$POLL"
done
