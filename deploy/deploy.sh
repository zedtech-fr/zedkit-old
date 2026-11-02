#!/usr/bin/env bash
# Publish the static docs build to the web host.
#
# Usage: deploy.sh [--dev|--rollback] <ssh-target> [remote-dir]
#   --dev       publish to the dev site directory and stamp the build;
#               content only: no config upload, no service changes
#   --rollback  restore the previous versioned release (site, suggest, config)
#   ssh-target  user@host of a machine with Docker and Compose installed
#   remote-dir  directory on the host (default: /srv/app)
#
# Run `pnpm --filter @zedtech/zedkit-docs build` first: the output
# directory apps/docs/out is what gets published. Idempotent; safe to re-run.
set -euo pipefail

mode="prod"
if [ "${1:-}" = "--dev" ]; then
  mode="dev"
  shift
elif [ "${1:-}" = "--rollback" ]; then
  mode="rollback"
  shift
fi

target="${1:?usage: deploy.sh [--dev|--rollback] <ssh-target> [remote-dir]}"
remote="${2:-/srv/app}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/apps/docs/out"

github_out() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s\n' "$1" >> "$GITHUB_OUTPUT"
  fi
}

reconcile_suggest() {
  local fp="$1"
  ssh "$target" "cd '$remote' && prev=\$(cat .suggest-fingerprint 2>/dev/null || true) && running=\$(docker compose ps --status running -q suggest || true) && if [ \"\$prev\" != '$fp' ] || [ -z \"\$running\" ]; then docker compose up -d --no-deps --force-recreate suggest; fi && printf '%s\n' '$fp' > .suggest-fingerprint"
}

recreate_caddy() {
  if ! ssh "$target" "cd '$remote' && docker compose up -d --no-deps --force-recreate caddy && docker compose ps --status running -q caddy | grep -q ."; then
    ssh "$target" "cd '$remote' && docker compose ps -a && docker compose logs --no-color --tail 200 caddy" || true
    echo "deploy: caddy did not come up after recreate" >&2
    return 1
  fi
}

reload_caddy() {
  if ! ssh "$target" "cd '$remote' && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"; then
    echo "deploy: reload failed, recreating once" >&2
    if ! ssh "$target" "cd '$remote' && docker compose up -d --remove-orphans && docker compose ps --status running -q caddy | grep -q . && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"; then
      ssh "$target" "cd '$remote' && docker compose ps -a && docker inspect -f 'OOMKilled={{.State.OOMKilled}} ExitCode={{.State.ExitCode}} Error={{.State.Error}}' \$(docker compose ps -aq caddy) && grep -c 'dev.zedkit.app' Caddyfile; docker compose logs --no-color --tail 200 caddy" || true
      echo "deploy: caddy did not come up; see container logs above" >&2
      return 1
    fi
  fi
}

if [ "$mode" = "rollback" ]; then
  ssh "$target" "cd '$remote' && prev=\$(cat .previous-release 2>/dev/null || true) && if [ -n \"\$prev\" ] && [ -d \"releases/\$prev\" ]; then ln -sfn \"releases/\$prev\" current; fi"
  fp="$(ssh "$target" "sha256sum '$remote/current/suggest/server.mjs' '$remote/current/suggest/tokens.mjs' '$remote/current/suggest.env' 2>/dev/null | sha256sum | awk '{print \$1}'")"
  recreate_caddy
  reconcile_suggest "$fp"
  github_out "switched=false"
  echo "deploy: rolled back"
  exit 0
fi

if [ ! -f "$out/index.html" ]; then
  echo "deploy: $out/index.html not found; build the docs first" >&2
  exit 1
fi

site="$remote/site"
if [ "$mode" = "dev" ]; then
  site="$remote/site-dev"
fi
case "$site" in
  "$remote/site"|"$remote/site-dev") ;;
  *) echo "deploy: refusing unexpected site dir: $site" >&2; exit 1 ;;
esac

ssh "$target" "mkdir -p '$remote/site-dev' '$remote/releases'"
if [ "$mode" = "prod" ]; then
  release_id="${DEPLOY_SHA:-}"
  if [ -z "$release_id" ]; then
    release_id="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
  fi
  release_dir="$remote/releases/$release_id"
  ssh "$target" "mkdir -p '$release_dir/site' '$release_dir/suggest'"

  rsync -a --delete "$out/" "$target:$release_dir/site/"
  rsync -a --delete --exclude '*.test.mjs' "$root/deploy/suggest/" "$target:$release_dir/suggest/"
  scp -q "$root/deploy/Caddyfile" "$target:$release_dir/Caddyfile"
  printf '%s\n' "$release_id" | ssh "$target" "cat > '$release_dir/SHA'"

  suggest_env="${DEPLOY_SUGGEST_ENV:-$root/deploy/suggest.env}"
  if [ -f "$suggest_env" ]; then
    scp -q "$suggest_env" "$target:$release_dir/suggest.env"
  else
    ssh "$target" "umask 077; : > '$release_dir/suggest.env'"
  fi

  fp="$(ssh "$target" "sha256sum '$release_dir/suggest/server.mjs' '$release_dir/suggest/tokens.mjs' '$release_dir/suggest.env' | sha256sum | awk '{print \$1}'")"
  release_file="$(mktemp)"
  printf '{"id":"%s","fingerprint":"%s"}\n' "$release_id" "$fp" > "$release_file"
  scp -q "$release_file" "$target:$release_dir/suggest/release.json"
  rm -f "$release_file"

  if ! ssh "$target" "docker run --rm -v '$release_dir/Caddyfile:/etc/caddy/Caddyfile:ro' caddy:2 caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile"; then
    github_out "switched=false"
    echo "deploy: release $release_id refused by caddy validate" >&2
    exit 1
  fi

  scp -q "$root/deploy/compose.yaml" "$root/deploy/compose.override.yaml" "$target:$remote/"
  ssh "$target" "cd '$remote' && if [ -L current ]; then basename \"\$(readlink current)\" > .previous-release; fi && ln -sfn 'releases/$release_id' current"
  # Bind mounts of ./current/* resolve the symlink when the container is
  # created, so a reload keeps serving the old release. Recreate caddy so it
  # mounts the new target.
  recreate_caddy
  reconcile_suggest "$fp"
  github_out "switched=true"
else
  branch="${DEV_BRANCH:-}"
  if [ -z "$branch" ]; then
    branch="$(git -C "$root" branch --show-current 2>/dev/null || echo manual)"
  fi
  sha="${DEV_SHA:-}"
  if [ -z "$sha" ]; then
    sha="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
  fi
  printf 'branch=%s\ncommit=%s\nbuilt=%s\n' "$branch" "$sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$out/dev-build.txt"
  printf 'User-agent: *\nDisallow: /' > "$out/robots.txt"
  rsync -a --delete "$out/" "$target:$site/"
  scp -q "$root/deploy/Caddyfile" "$target:$remote/current/Caddyfile"
  if ! ssh "$target" "docker run --rm -v '$remote/current/Caddyfile:/etc/caddy/Caddyfile:ro' caddy:2 caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile"; then
    echo "deploy: dev Caddyfile refused by caddy validate" >&2
    exit 1
  fi
  reload_caddy
fi
echo "deploy: done"
