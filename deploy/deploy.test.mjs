import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CURRENT = {
  spacing: "0.25rem",
  borderWidth: "1px",
  radius: "0.5rem",
  bodyLeading: "1.6",
  headingLeading: "1.1",
  headingTracking: "-0.025em",
  labelTracking: "0.025em",
  fontSans: "Inter, sans-serif",
  fontDisplay: "Inter, sans-serif",
  light: {
    background: "0 0% 100%",
    foreground: "240 10% 3.9%",
    primary: "240 5.9% 10%",
    accent: "240 4.8% 95.9%",
    border: "240 5.9% 90%",
  },
  dark: {
    background: "240 10% 3.9%",
    foreground: "0 0% 98%",
    primary: "0 0% 98%",
    accent: "240 3.7% 15.9%",
    border: "240 3.7% 15.9%",
  },
  shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

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

function listenUpstream() {
  const hits = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const sendJson = (body) => {
        res.writeHead(200, {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        });
        res.end(body);
      };
      // Suggest logs provider models at startup (GET, no body); only chat POSTs count as hits.
      if (String(req.url ?? "").includes("/models")) {
        sendJson(JSON.stringify({ data: [{ id: "model-a" }, { id: "model-b" }] }));
        return;
      }
      if (raw) hits.push(JSON.parse(raw));
      sendJson(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ summary: "More air.", tokens: { spacing: "0.4rem" } }) } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        }),
      );
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, hits, port: address.port });
    });
  });
}

function installMocks(bin, state) {
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
remote="${"${DEPLOY_MOCK_REMOTE}"}"
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
cd "$remote/current/suggest"
nohup node server.mjs >> "$state/suggest.log" 2>&1 &
echo $! > "$state/suggest.pid"
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50; do
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
  exit 0
fi
if [[ "$1" != "compose" ]]; then
  echo "mock docker: unexpected $*" >&2
  exit 1
fi
shift
cmd="$1"
shift
case "$cmd" in
  exec)
    case "$*" in
      *reload*)
        [[ -f "${state}/caddy-up" ]]
        exit $?
        ;;
    esac
    exit 1
    ;;
  ps)
    case "$*" in
      *suggest*)
        if [[ -f "${state}/suggest.pid" ]] && kill -0 "$(cat "${state}/suggest.pid")" 2>/dev/null; then
          echo suggest
        fi
        exit 0
        ;;
      *caddy*)
        if [[ -f "${state}/caddy-up" ]]; then echo caddy; fi
        exit 0
        ;;
    esac
    exit 0
    ;;
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
  *)
    exit 0
    ;;
esac
`,
  );
}

test("deploy A then B with Caddy already up announces B and uses the new parameters", async (t) => {
  const tmp = await mkdtemp(join(tmpdir(), "deploy-suggest-"));
  const bin = join(tmp, "bin");
  const state = join(tmp, "state");
  const remote = join(tmp, "remote");
  const envFile = join(tmp, "suggest.env");
  // Its own build output: test files run in parallel, and a shared apps/docs/out is a race.
  const outDir = join(tmp, "out");
  const upstream = await listenUpstream();
  const suggestPort = await freePort();
  installMocks(bin, state);
  writeFileSync(join(state, "caddy-up"), "");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), "<!doctype html><title>docs</title>");

  t.after(async () => {
    const pidFile = join(state, "suggest.pid");
    if (existsSync(pidFile)) {
      const pid = (await readFile(pidFile, "utf8")).trim();
      if (pid) spawnSync("kill", [pid]);
    }
    await new Promise((resolve) => upstream.server.close(() => resolve()));
    await rm(tmp, { recursive: true, force: true });
  });

  const writeEnv = (model, maxTokens) => {
    writeFileSync(
      envFile,
      [
        "IDENTITY_AI_ENABLED=1",
        `IDENTITY_AI_BASE_URL=http://127.0.0.1:${upstream.port}`,
        "IDENTITY_AI_API_KEY=test-key",
        `IDENTITY_AI_MODEL=${model}`,
        `IDENTITY_AI_MAX_TOKENS=${maxTokens}`,
        "IDENTITY_AI_PRICE_INPUT_USD_PER_MTOK=1",
        "IDENTITY_AI_PRICE_OUTPUT_USD_PER_MTOK=10",
        "IDENTITY_AI_BUDGET_DAILY_USD=5",
        `IDENTITY_AI_STATE_DIR=${join(tmp, "ledger")}`,
        "",
      ].join("\n"),
    );
  };

  const deploy = (sha) => {
    const result = spawnSync("bash", [join(root, "deploy/deploy.sh"), "user@example", remote], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        DEPLOY_SHA: sha,
        DEPLOY_OUT: outDir,
        DEPLOY_SUGGEST_ENV: envFile,
        DEPLOY_MOCK_REMOTE: remote,
        DEPLOY_KEEP_RELEASES: "2",
        SUGGEST_PORT: String(suggestPort),
      },
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  };

  const version = async () => {
    const res = await fetch(`http://127.0.0.1:${suggestPort}/api/identity/suggest/version`, {
      headers: { connection: "close" },
    });
    assert.equal(res.status, 200);
    return res.json();
  };

  const suggest = async () => {
    const res = await fetch(`http://127.0.0.1:${suggestPort}/api/identity/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: JSON.stringify({ requestId: `deploy-test-${Math.random().toString(36).slice(2, 10)}`, prompt: "warmer", current: CURRENT }),
    });
    assert.equal(res.status, 200);
  };

  writeEnv("model-a", "300");
  deploy("sha-a");
  const first = await version();
  assert.equal(first.id.startsWith("sha-a"), true, JSON.stringify(first));
  assert.equal(first.model, "model-a");
  assert.equal(first.maxTokens, 300);
  await suggest();
  assert.equal(upstream.hits[0].model, "model-a");
  assert.equal(upstream.hits[0].max_tokens, 300);

  writeEnv("model-b", "400");
  deploy("sha-b");
  const second = await version();
  assert.notEqual(second.id, first.id);
  assert.equal(second.id.startsWith("sha-b"), true, JSON.stringify(second));
  assert.equal(second.model, "model-b");
  assert.equal(second.maxTokens, 400);
  assert.equal(JSON.stringify(second).includes("test-key"), false);
  await suggest();
  assert.equal(upstream.hits[1].model, "model-b");
  assert.equal(upstream.hits[1].max_tokens, 400);

  const pid = (await readFile(join(state, "suggest.pid"), "utf8")).trim();
  deploy("sha-b");
  assert.equal((await readFile(join(state, "suggest.pid"), "utf8")).trim(), pid);
  const again = await version();
  assert.equal(again.id, second.id);
  assert.equal(again.model, "model-b");

  const log = await readFile(join(state, "docker.log"), "utf8");
  assert.match(log, /compose up -d --no-deps --force-recreate caddy/);

  // The env file holds the provider key: private from the moment it exists, whatever mode the sender's file had.
  assert.equal(statSync(envFile).mode & 0o044, 0o044, "the sender's file is world-readable, as CI may leave it");
  assert.equal(statSync(join(remote, "releases/sha-b/suggest.env")).mode & 0o777, 0o600);

  // Old releases (each one holds a key) are pruned; the live one and the one rollback needs stay.
  deploy("sha-c");
  deploy("sha-d");
  const kept = readdirSync(join(remote, "releases")).sort();
  assert.deepEqual(kept, ["sha-c", "sha-d"], "only the newest releases remain");
  assert.equal((await readFile(join(remote, ".previous-release"), "utf8")).trim(), "sha-c");
});

test("--dev gives the dev site its own suggest service and leaves production's alone", async (t) => {
  const tmp = await mkdtemp(join(tmpdir(), "deploy-dev-"));
  const bin = join(tmp, "bin");
  const state = join(tmp, "state");
  const remote = join(tmp, "remote");
  const envFile = join(tmp, "suggest-dev.env");
  const outDir = join(tmp, "out");
  installMocks(bin, state);
  // A docker that only records, and reports suggest-dev as running once it has been brought up.
  writeExec(
    join(bin, "docker"),
    `#!/bin/bash
printf '%s\\n' "$*" >> "${state}/docker.log"
case "$*" in
  *"ps --status running -q suggest-dev"*) [ -f "${state}/dev-up" ] && echo suggest-dev; exit 0 ;;
  *"up -d --no-deps --force-recreate suggest-dev"*) touch "${state}/dev-up"; exit 0 ;;
  *"exec -T caddy caddy reload"*) exit 0 ;;
esac
exit 0
`,
  );
  mkdirSync(join(remote, "current"), { recursive: true });
  writeFileSync(join(remote, "current", "marker"), "production");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), "<!doctype html><title>docs</title>");
  t.after(async () => {
    await rm(tmp, { recursive: true, force: true });
  });
  writeFileSync(envFile, "IDENTITY_AI_ENABLED=0\n");

  const deploy = (sha) => {
    const result = spawnSync("bash", [join(root, "deploy/deploy.sh"), "--dev", "user@example", remote], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, DEPLOY_OUT: outDir, DEV_SHA: sha, DEV_BRANCH: "integration/visual-followup", DEPLOY_SUGGEST_DEV_ENV: envFile },
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  };

  deploy("sha-dev-1");
  const dev = join(remote, "suggest-dev");
  for (const file of ["server.mjs", "ledger.mjs", "references.mjs", "tokens.mjs", "config.mjs", "release.json"]) {
    assert.ok(existsSync(join(dev, "code", file)), `${file} is deployed`);
  }
  assert.equal(existsSync(join(dev, "code", "server.test.mjs")), false, "tests are not deployed");
  assert.equal(await readFile(join(dev, "suggest.env"), "utf8"), "IDENTITY_AI_ENABLED=0\n");
  assert.equal(JSON.parse(await readFile(join(dev, "code", "release.json"), "utf8")).id, "sha-dev-1");
  assert.ok(existsSync(join(remote, "compose.dev.yaml")));

  const log = () => readFile(join(state, "docker.log"), "utf8");
  const recreate = "compose -f compose.yaml -f compose.override.yaml -f compose.dev.yaml up -d --no-deps --force-recreate suggest-dev";
  assert.match(await log(), new RegExp(recreate));
  // Production's service and release pointer are not part of a dev deploy.
  assert.doesNotMatch(await log(), /force-recreate suggest\s*$/m);
  assert.doesNotMatch(await log(), /force-recreate caddy/);
  assert.equal(existsSync(join(remote, ".previous-release")), false);
  assert.equal(await readFile(join(remote, "current", "marker"), "utf8"), "production");

  // Nothing changed: the container is left running.
  const before = (await log()).split("\n").filter((line) => line.includes(recreate)).length;
  deploy("sha-dev-1");
  assert.equal((await log()).split("\n").filter((line) => line.includes(recreate)).length, before, "an unchanged deploy does not recreate it");
  // Its env changed: it is recreated, because the fingerprint covers the env.
  writeFileSync(envFile, "IDENTITY_AI_ENABLED=1\n");
  deploy("sha-dev-1");
  assert.equal((await log()).split("\n").filter((line) => line.includes(recreate)).length, before + 1);
});
