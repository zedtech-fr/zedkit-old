#!/usr/bin/env bash
# CI: Vite + React 19 + Tailwind 4 smoke for both UI quickstart paths.
# Snippet text lives in apps/docs/home-quickstart/snippets (see snippet-manifest.mjs).
# Registry path uses built JSON under apps/docs/public/r (same URLs as docs, rewritten locally in CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SNIPPETS="${ROOT}/apps/docs/home-quickstart/snippets"
REGISTRY_DIR="${ROOT}/apps/docs/public/r"
SHADCN="${SHADCN_VERSION:-4.22.1}"
CREATE_VITE="${CREATE_VITE_VERSION:-7.1.3}"

cleanup_work() { rm -rf "$1"; }

normalize_shadcn_alias_tree() {
  if [[ -d ./@ ]]; then
    mkdir -p src
    cp -a ./@/. src/
    rm -rf ./@
  fi
}

run_registry_snippet() {
  local snippet_file="$1"
  local cmd
  cmd="$(sed "s#https://zedkit.app/r/#${REGISTRY_DIR}/#" "$snippet_file")"
  if [[ "$cmd" != *" -y"* ]]; then
    cmd="${cmd} -y -o"
  fi
  bash -c "$cmd"
}

write_vite_tailwind_app() {
  local work="$1"
  node -e "
const fs = require('node:fs');
const path = require('node:path');
const work = process.argv[1];
const tsconfigPath = path.join(work, 'tsconfig.app.json');
const ts = fs.readFileSync(tsconfigPath, 'utf8');
const patched = ts.replace(
  '\"jsx\": \"react-jsx\",',
  '\"jsx\": \"react-jsx\",\n    \"baseUrl\": \".\",\n    \"paths\": { \"@/*\": [\"./src/*\"] },',
);
fs.writeFileSync(tsconfigPath, patched);
fs.writeFileSync(path.join(work, 'vite.config.ts'), \`import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
\`);
fs.writeFileSync(path.join(work, 'src', 'main.tsx'), \`import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
\`);
" "$work"
  printf '%s\n' '@import "tailwindcss";' > "${work}/src/index.css"
}

run_npm_path() {
  local work="${TMPDIR:-/tmp}/zedkit-quickstart-npm-$$"
  trap 'cleanup_work "$work"' RETURN
  (cd "${TMPDIR:-/tmp}" && pnpm dlx "create-vite@${CREATE_VITE}" "$(basename "$work")" --template react-ts)
  cd "$work"
  pnpm install
  pnpm add tailwindcss @tailwindcss/vite react@19 react-dom@19
  pnpm add -D @types/node
  write_vite_tailwind_app "$work"

  local pack_dir="${work}/pack"
  mkdir -p "$pack_dir"
  (cd "${ROOT}/packages/ui" && pnpm pack --pack-destination "$pack_dir" >/dev/null)
  local tgz
  tgz="$(ls "$pack_dir"/*.tgz)"
  pnpm add "$tgz"

  cp "${SNIPPETS}/npm-globals.css" src/index.css
  cp "${SNIPPETS}/npm-page.tsx" src/App.tsx
  bash -c "$(cat "${SNIPPETS}/install.sh")"

  pnpm exec tsc -b
  pnpm run build
  node "${ROOT}/scripts/quickstart-render-check.mjs" dist "quickstart-smoke: npm path"
  echo "quickstart-smoke: npm path ok (Vite build, styled Button rendered)"
}

run_registry_path() {
  local work="${TMPDIR:-/tmp}/zedkit-quickstart-registry-$$"
  trap 'cleanup_work "$work"' RETURN
  if [[ ! -f "${REGISTRY_DIR}/button.json" ]]; then
    echo "quickstart-smoke: missing ${REGISTRY_DIR}/button.json (run pnpm registry:build)" >&2
    exit 1
  fi

  (cd "${TMPDIR:-/tmp}" && pnpm dlx "create-vite@${CREATE_VITE}" "$(basename "$work")" --template react-ts)
  cd "$work"
  pnpm install
  pnpm add tailwindcss @tailwindcss/vite react@19 react-dom@19
  pnpm add -D @types/node
  write_vite_tailwind_app "$work"
  pnpm dlx "shadcn@${SHADCN}" init -d
  rm -rf src/components src/lib @ 2>/dev/null || true
  run_registry_snippet "${SNIPPETS}/registry-theme-add.sh"
  run_registry_snippet "${SNIPPETS}/registry-add.sh"
  normalize_shadcn_alias_tree
  cp "${SNIPPETS}/registry-page.tsx" src/App.tsx

  pnpm exec tsc -b
  pnpm run build
  node "${ROOT}/scripts/quickstart-render-check.mjs" dist "quickstart-smoke: registry path"
  echo "quickstart-smoke: registry path ok (Vite build, styled Button rendered)"
}

# The render check needs Chromium; CI runners also need its system libraries.
(cd "${ROOT}" && pnpm exec playwright install ${CI:+--with-deps} chromium >/dev/null)
echo "quickstart-smoke: eligible for ci-required once stable on main (not in branch protection yet)"
(cd "${ROOT}" && pnpm exec turbo run build --filter=@zedtech/zedkit-ui >/dev/null)
(cd "${ROOT}" && pnpm registry:build >/dev/null)
run_npm_path
run_registry_path
echo "quickstart-smoke: ok"
