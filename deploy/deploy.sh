#!/usr/bin/env bash
# Publish the static docs build to the web host.
#
# Usage: deploy.sh [--dev|--rollback] <ssh-target> [remote-dir]
#   --dev       publish to the dev site directory and stamp the build, and (re)start the dev
#               site's own suggest service (suggest-dev: its own code, env and ledger; production's
#               service, release pointer and compose files are not touched)
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
out="${DEPLOY_OUT:-$root/apps/docs/out}"

github_out() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s\n' "$1" >> "$GITHUB_OUTPUT"
  fi
}

# A secret file, created private (0600) from the first byte: `scp` would keep the sender's mode, which may be world-readable.
put_secret() {
  ssh "$target" "umask 077; cat > '$2'" < "$1"
}

# Release directories hold a provider key each. Keep the newest few, never the live one or the one rollback needs.
keep_releases="${DEPLOY_KEEP_RELEASES:-5}"
prune_releases() {
  ssh "$target" "cd '$remote' && keep=\"\$(basename \"\$(readlink current)\") \$(cat .previous-release 2>/dev/null || true)\" && ls -1t releases | tail -n +$((keep_releases + 1)) | while read -r old; do case \" \$keep \" in *\" \$old \"*) ;; *) rm -rf \"releases/\$old\" ;; esac; done"
}

# Every file the service runs from, and its env: a change to any of them recreates the container.
suggest_fingerprint() {
  local dir="$1"
  ssh "$target" "cd '$dir' && { find suggest -type f ! -name release.json | sort | xargs sha256sum; sha256sum suggest.env; } 2>/dev/null | sha256sum | awk '{print \$1}'"
}

# The dev site's suggest service: copied to its own directory and recreated only when its code or env changed.
deploy_suggest_dev() {
  local dev_dir="$remote/suggest-dev"
  local sha="$1"
  local compose="docker compose -f compose.yaml -f compose.override.yaml -f compose.dev.yaml"
  ssh "$target" "mkdir -p '$dev_dir/code'"
  rsync -a --delete --exclude '*.test.mjs' "$root/deploy/suggest/" "$target:$dev_dir/code/"
  scp -q "$root/deploy/compose.dev.yaml" "$target:$remote/compose.dev.yaml"
  local env_file="${DEPLOY_SUGGEST_DEV_ENV:-$root/deploy/suggest-dev.env}"
  if [ -f "$env_file" ]; then
    put_secret "$env_file" "$dev_dir/suggest.env"
  else
    ssh "$target" "umask 077; : > '$dev_dir/suggest.env'"
  fi
  local fp
  fp="$(ssh "$target" "cd '$dev_dir' && { find code -type f ! -name release.json | sort | xargs sha256sum; sha256sum suggest.env; } 2>/dev/null | sha256sum | awk '{print \$1}'")"
  local release_file
  release_file="$(mktemp)"
  chmod 644 "$release_file"  # suggest runs with cap_drop ALL: root cannot read a 0600 file it does not own
  printf '{"id":"%s","fingerprint":"%s"}\n' "$sha" "$fp" > "$release_file"
  scp -q "$release_file" "$target:$dev_dir/code/release.json"
  rm -f "$release_file"
  ssh "$target" "cd '$remote' && prev=\$(cat .suggest-dev-fingerprint 2>/dev/null || true) && running=\$($compose ps --status running -q suggest-dev || true) && if [ \"\$prev\" != '$fp' ] || [ -z \"\$running\" ]; then $compose up -d --no-deps --force-recreate suggest-dev; fi && printf '%s\n' '$fp' > .suggest-dev-fingerprint"
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
  fp="$(suggest_fingerprint "$remote/current")"
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
    put_secret "$suggest_env" "$release_dir/suggest.env"
  else
    ssh "$target" "umask 077; : > '$release_dir/suggest.env'"
  fi

  fp="$(suggest_fingerprint "$release_dir")"
  release_file="$(mktemp)"
  chmod 644 "$release_file"  # suggest runs with cap_drop ALL: root cannot read a 0600 file it does not own
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
  prune_releases
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
  # The service the dev Caddyfile proxies to must exist before the config that names it goes live.
  deploy_suggest_dev "$sha"
  scp -q "$root/deploy/Caddyfile" "$target:$remote/current/Caddyfile"
  if ! ssh "$target" "docker run --rm -v '$remote/current/Caddyfile:/etc/caddy/Caddyfile:ro' caddy:2 caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile"; then
    echo "deploy: dev Caddyfile refused by caddy validate" >&2
    exit 1
  fi
  reload_caddy
fi
echo "deploy: done"
