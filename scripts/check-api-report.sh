#!/usr/bin/env bash
# Public API reports for every publishable package under packages/*.
# After build (quality ships source), this runs api-extractor (or the
# server .d.ts dump) and fails on report drift.
# A report that changed versus origin/main also needs a changeset; a
# removed or renamed export needs minor (0.x breaking) or major.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

write=0
[ "${1:-}" = "--write" ] && write=1

fail=0

# pkg|types-entry|report file  (quality has a second export path)
entries=(
  "ai|dist/index.d.ts|zedkit-ai.api.md"
  "core|dist/index.d.ts|zedkit-core.api.md"
  "devtools|dist/index.d.ts|zedkit-devtools.api.md"
  "flags|dist/index.d.ts|zedkit-flags.api.md"
  "i18n|dist/index.d.ts|zedkit-i18n.api.md"
  "nest|dist/index.d.ts|zedkit-nest.api.md"
  "observability|dist/index.d.ts|zedkit-observability.api.md"
  "payload-seo|dist/index.d.ts|zedkit-payload-seo.api.md"
  "quality|src/index.d.mts|zedkit-quality.api.md"
  "quality|src/eslint.d.mts|zedkit-quality-eslint.api.md"
  "seo|dist/index.d.ts|zedkit-seo.api.md"
  "server|dist/index.d.ts|zedkit-server.api.md"
  "storage|dist/index.d.ts|zedkit-storage.api.md"
  "ui|dist/index.d.ts|zedkit-ui.api.md"
)

write_config() {
  local pkg="$1" entry="$2" report="$3" out="$4"
  # Config lives under packages/<pkg>/temp so extractor finds package.json
  # by walking up. projectFolder ".." is the package root.
  cat >"$out" <<JSON
{
  "projectFolder": "..",
  "mainEntryPointFilePath": "<projectFolder>/$entry",
  "bundledPackages": [],
  "apiReport": {
    "enabled": true,
    "reportFolder": "<projectFolder>/etc",
    "reportFileName": "$report"
  },
  "docModel": { "enabled": false },
  "dtsRollup": { "enabled": false },
  "tsdocMetadata": { "enabled": false },
  "newlineKind": "lf",
  "compiler": { "skipLibCheck": true },
  "messages": {
    "compilerMessageReporting": { "default": { "logLevel": "warning" } },
    "extractorMessageReporting": {
      "default": { "logLevel": "warning" },
      "ae-missing-release-tag": { "logLevel": "none" }
    },
    "tsdocMessageReporting": { "default": { "logLevel": "none" } }
  }
}
JSON
}

for spec in "${entries[@]}"; do
  IFS='|' read -r pkg entry report <<<"$spec"
  src="packages/$pkg/$entry"
  if [ ! -f "$src" ]; then
    echo "$pkg: missing $entry (run build first, except quality)"
    fail=1
    continue
  fi
  mkdir -p "packages/$pkg/etc" "packages/$pkg/temp"
  dest="packages/$pkg/etc/$report"
  # api-extractor 7.60 bundles TypeScript 6 and crashes following Buffer
  # (server webhook helpers). Dump the tsc .d.ts graph instead.
  if [ "$pkg" = server ]; then
    generated="packages/$pkg/temp/$report"
    if ! node scripts/dts-api-report.mjs "$src" "@zedtech/zedkit-$pkg" "$generated"; then
      echo "api-report: $pkg dump failed"
      fail=1
      continue
    fi
    if [ "$write" = 1 ]; then
      cp "$generated" "$dest"
      echo "api-report: $pkg $report wrote"
    elif ! diff -q "$dest" "$generated" >/dev/null; then
      echo "api-report: $pkg $report drifted"
      diff -u "$dest" "$generated" || true
      fail=1
    else
      echo "api-report: $pkg $report ok"
    fi
    continue
  fi
  cfg="packages/$pkg/temp/$report.extractor.json"
  write_config "$pkg" "$entry" "$report" "$cfg"
  generated="packages/$pkg/temp/$report"
  pnpm exec api-extractor run --config "$cfg" --local >/dev/null 2>&1 || true
  if [ ! -f "$generated" ]; then
    echo "api-report: $pkg $report drifted or extractor failed"
    fail=1
  elif [ "$write" = 1 ]; then
    cp "$generated" "$dest"
    echo "api-report: $pkg $report wrote"
  elif ! diff -q "$dest" "$generated" >/dev/null; then
    echo "api-report: $pkg $report drifted"
    diff -u "$dest" "$generated" || true
    fail=1
  else
    echo "api-report: $pkg $report ok"
  fi
done

[ "$fail" -eq 0 ] || { echo "api-report: extractor FAILED"; exit 1; }

python3 - <<'PY'
import subprocess
import sys
from pathlib import Path

root = Path(".")
base = "origin/main"
probe = subprocess.run(
    ["git", "rev-parse", "--verify", base], capture_output=True, text=True
)
if probe.returncode != 0:
    print("api-report: no origin/main, skip changeset gate")
    sys.exit(0)

reports = [
    ("packages/ai/etc/zedkit-ai.api.md", "@zedtech/zedkit-ai"),
    ("packages/core/etc/zedkit-core.api.md", "@zedtech/zedkit-core"),
    ("packages/devtools/etc/zedkit-devtools.api.md", "@zedtech/zedkit-devtools"),
    ("packages/flags/etc/zedkit-flags.api.md", "@zedtech/zedkit-flags"),
    ("packages/i18n/etc/zedkit-i18n.api.md", "@zedtech/zedkit-i18n"),
    ("packages/nest/etc/zedkit-nest.api.md", "@zedtech/zedkit-nest"),
    ("packages/observability/etc/zedkit-observability.api.md", "@zedtech/zedkit-observability"),
    ("packages/payload-seo/etc/zedkit-payload-seo.api.md", "@zedtech/zedkit-payload-seo"),
    ("packages/quality/etc/zedkit-quality.api.md", "@zedtech/zedkit-quality"),
    ("packages/quality/etc/zedkit-quality-eslint.api.md", "@zedtech/zedkit-quality"),
    ("packages/seo/etc/zedkit-seo.api.md", "@zedtech/zedkit-seo"),
    ("packages/server/etc/zedkit-server.api.md", "@zedtech/zedkit-server"),
    ("packages/storage/etc/zedkit-storage.api.md", "@zedtech/zedkit-storage"),
    ("packages/ui/etc/zedkit-ui.api.md", "@zedtech/zedkit-ui"),
]

bumps: dict[str, set[str]] = {}
name_re = __import__("re").compile(r'^["\']([^"\']+)["\']\s*:\s*(patch|minor|major)')
for cs in sorted(root.glob(".changeset/*.md")):
    text = cs.read_text()
    if not text.startswith("---"):
        continue
    end = text.find("\n---", 3)
    if end < 0:
        continue
    for line in text[4:end].splitlines():
        match = name_re.match(line.strip())
        if match:
            bumps.setdefault(match.group(1), set()).add(match.group(2))

fail = 0
for path, pkg in reports:
    existed = subprocess.run(
        ["git", "cat-file", "-e", f"{base}:{path}"],
        capture_output=True,
    )
    if existed.returncode != 0:
        continue
    diff = subprocess.check_output(["git", "diff", base, "--", path], text=True)
    if not diff.strip():
        continue
    kinds = bumps.get(pkg, set())
    if not kinds:
        print(f"{path}: API report changed; add a changeset for {pkg}")
        fail = 1
        continue
    removed = any(
        line.startswith("-export ") for line in diff.splitlines()
    )
    if removed and kinds.isdisjoint({"minor", "major"}):
        print(
            f"{path}: removed or renamed export needs a minor "
            f"(0.x breaking) or major changeset for {pkg}"
        )
        fail = 1

if fail:
    print("api-report: changeset gate FAILED")
    sys.exit(1)
print("api-report: changeset gate ok")
PY
status=$?
[ "$status" -eq 0 ] || exit "$status"
echo "api-report: ok"
