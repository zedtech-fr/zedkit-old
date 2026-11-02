import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = join(root, ".github/workflows/deploy-docs.yml");

function writeExec(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function installMocks(bin, state, remote) {
  mkdirSync(bin, { recursive: true });
  mkdirSync(state, { recursive: true });
  writeExec(
    join(bin, "ssh"),
    `#!/bin/bash
exec bash -c "$2"
`,
  );
  writeExec(
    join(bin, "scp"),
    `#!/bin/bash
while [[ "\${1:-}" == -* ]]; do shift; done
dest="\${@: -1}"
dest="\${dest#*:}"
files=("\${@:1:$#-1}")
if [[ "$dest" == */ ]]; then
  mkdir -p "$dest"
  cp "\${files[@]}" "$dest"
else
  mkdir -p "$(dirname "$dest")"
  cp "\${files[0]}" "$dest"
fi
`,
  );
  writeExec(
    join(bin, "rsync"),
    `#!/bin/bash
args=()
for a in "$@"; do
  case "$a" in
    *:*) args+=("\${a#*:}") ;;
    *) args+=("$a") ;;
  esac
done
exec /usr/bin/rsync "\${args[@]}"
`,
  );
  writeExec(
    join(state, "start-suggest.sh"),
    `#!/bin/bash
set -euo pipefail
state="${state}"
remote="${remote}"
app="$remote/current/suggest"
if [[ ! -d "$app" ]]; then
  exit 0
fi
if [[ -f "$state/suggest.pid" ]]; then
  old="$(cat "$state/suggest.pid")"
  kill "$old" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    kill -0 "$old" 2>/dev/null || break
    sleep 0.05
  done
  kill -9 "$old" 2>/dev/null || true
fi
set -a
source "$remote/current/suggest.env"
set +a
export PORT="$SUGGEST_PORT"
cd "$app"
nohup node server.mjs >> "$state/suggest.log" 2>&1 &
echo $! > "$state/suggest.pid"
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40; do
  if node --input-type=module -e 'import net from "node:net"; const s = net.connect(Number(process.env.PORT), "127.0.0.1", () => { s.end(); process.exit(0); }); s.on("error", () => process.exit(1));'; then
    exit 0
  fi
  sleep 0.05
done
echo "suggest did not listen" >&2
cat "$state/suggest.log" >&2 || true
exit 1
`,
  );
  writeExec(
    join(bin, "docker"),
    `#!/bin/bash
printf '%s\\n' "$*" >> "${state}/docker.log"
if [[ "$1" == "run" ]]; then
  if [[ -f "${state}/fail-validate" ]]; then
    echo "validate refused" >&2
    exit 1
  fi
  exit 0
fi
if [[ "$1" != "compose" ]]; then
  exit 0
fi
shift
cmd="$1"
shift
case "$cmd" in
  up)
    case "$*" in
      *suggest*)
        "${state}/start-suggest.sh"
        exit $?
        ;;
      *caddy*)
        touch "${state}/caddy-up"
        exit 0
        ;;
      *)
        touch "${state}/caddy-up"
        "${state}/start-suggest.sh"
        exit $?
        ;;
    esac
    ;;
  exec)
    [[ -f "${state}/caddy-up" ]]
    exit $?
    ;;
  ps)
    case "$*" in
      *caddy*)
        if [[ -f "${state}/caddy-up" ]]; then echo caddy; fi
        ;;
    esac
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
`,
  );
}

test("rollback restores content, service, and config to one sha", async (t) => {
  const tmp = await mkdtemp(join(tmpdir(), "deploy-rollback-"));
  const bin = join(tmp, "bin");
  const state = join(tmp, "state");
  const remote = join(tmp, "remote");
  const outDir = join(tmp, "out");
  const envPath = join(root, "deploy/suggest.env");
  const savedEnv = existsSync(envPath) ? await readFile(envPath) : null;
  const suggestPort = await freePort();
  installMocks(bin, state, remote);
  writeFileSync(join(state, "caddy-up"), "");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), "<!doctype html><title>docs</title>");

  const output = join(tmp, "github-output.txt");
  writeFileSync(output, "");

  t.after(async () => {
    const pidFile = join(state, "suggest.pid");
    if (existsSync(pidFile)) {
      const pid = (await readFile(pidFile, "utf8")).trim();
      if (pid) spawnSync("kill", [pid]);
    }
    if (savedEnv === null) await rm(envPath, { force: true });
    else writeFileSync(envPath, savedEnv);
    await rm(tmp, { recursive: true, force: true });
  });

  const envFor = (model, maxTokens) => {
    writeFileSync(
      envPath,
      [
        "IDENTITY_AI_BASE_URL=http://127.0.0.1:9",
        "IDENTITY_AI_API_KEY=test-key",
        `IDENTITY_AI_MODEL=${model}`,
        `IDENTITY_AI_MAX_TOKENS=${maxTokens}`,
        "",
      ].join("\n"),
    );
  };

  const deploy = (args, sha) => {
    writeFileSync(output, "");
    const result = spawnSync("bash", [join(root, "deploy/deploy.sh"), ...args, "user@example", remote], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        DEPLOY_SHA: sha,
        DEPLOY_OUT: outDir,
        GITHUB_OUTPUT: output,
        SUGGEST_PORT: String(suggestPort),
      },
    });
    return result;
  };

  const switched = async () => (await readFile(output, "utf8")).includes("switched=true");

  const live = async () => {
    const content = (await readFile(join(remote, "current/site/release.txt"), "utf8")).trim();
    const config = (await readFile(join(remote, "current/SHA"), "utf8")).trim();
    const link = basename(readlinkSync(join(remote, "current")));
    const res = await fetch(`http://127.0.0.1:${suggestPort}/api/identity/suggest/version`, {
      headers: { connection: "close" },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(JSON.stringify(body).includes("test-key"), false);
    return { content, config, link, service: body.id, model: body.model };
  };

  envFor("model-a", "111");
  writeFileSync(join(outDir, "release.txt"), "sha-a\n");
  const first = deploy([], "sha-a");
  assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
  assert.deepEqual(await live(), {
    content: "sha-a",
    config: "sha-a",
    link: "sha-a",
    service: "sha-a",
    model: "model-a",
  });

  writeFileSync(join(state, "fail-validate"), "");
  envFor("model-b", "222");
  writeFileSync(join(outDir, "release.txt"), "sha-b\n");
  const interrupted = deploy([], "sha-b");
  assert.notEqual(interrupted.status, 0);
  assert.equal(await switched(), false);
  const afterInterrupt = deploy(["--rollback"], "sha-b");
  assert.equal(afterInterrupt.status, 0, `${afterInterrupt.stdout}\n${afterInterrupt.stderr}`);
  assert.deepEqual(await live(), {
    content: "sha-a",
    config: "sha-a",
    link: "sha-a",
    service: "sha-a",
    model: "model-a",
  });

  await rm(join(state, "fail-validate"), { force: true });
  const second = deploy([], "sha-b");
  assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`);
  assert.equal(await switched(), true);
  assert.deepEqual(await live(), {
    content: "sha-b",
    config: "sha-b",
    link: "sha-b",
    service: "sha-b",
    model: "model-b",
  });

  const rolled = deploy(["--rollback"], "sha-b");
  assert.equal(rolled.status, 0, `${rolled.stdout}\n${rolled.stderr}`);
  assert.deepEqual(await live(), {
    content: "sha-a",
    config: "sha-a",
    link: "sha-a",
    service: "sha-a",
    model: "model-a",
  });
  assert.equal(existsSync(join(remote, "releases/sha-b")), true);

  const again = deploy(["--rollback"], "sha-a");
  assert.equal(again.status, 0, `${again.stdout}\n${again.stderr}`);
  assert.deepEqual(await live(), {
    content: "sha-a",
    config: "sha-a",
    link: "sha-a",
    service: "sha-a",
    model: "model-a",
  });
});

test("workflow rolls back only after the deploy step switched", () => {
  const text = readFileSync(workflow, "utf8");
  assert.match(text, /id:\s*deploy/);
  assert.match(text, /failure\(\) && steps\.deploy\.outputs\.switched == 'true'/);
});
