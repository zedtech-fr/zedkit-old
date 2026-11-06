import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));

test("Caddyfile adapts with handle_errors at site level", () => {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`,
      "caddy:2",
      "caddy",
      "validate",
      "--config",
      "/etc/caddy/Caddyfile",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout + result.stderr, /Valid configuration/);
});

test("Caddyfile declares each site host exactly once", () => {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`,
      "caddy:2",
      "caddy",
      "adapt",
      "--config",
      "/etc/caddy/Caddyfile",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const config = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  const counts = new Map();
  for (const server of Object.values(config.apps.http.servers)) {
    for (const route of server.routes ?? []) {
      for (const m of route.match ?? []) {
        for (const host of m.host ?? []) {
          counts.set(host, (counts.get(host) ?? 0) + 1);
        }
      }
    }
  }
  assert.ok(counts.get("zedkit.app") >= 1);
  for (const [host, count] of counts) {
    assert.equal(count, 1, `${host} declared ${count} times`);
  }
  const devRoute = Object.values(config.apps.http.servers)
    .flatMap((server) => server.routes ?? [])
    .find((route) =>
      (route.match ?? []).some((m) => (m.host ?? []).includes("dev.zedkit.app")),
    );
  assert.ok(devRoute, "dev site route missing");
  const dev = JSON.stringify(devRoute);
  assert.ok(dev.includes('"root":"/srv/site-dev"'), dev);
  assert.ok(dev.includes("noindex, nofollow"), dev);
  // The dev site proxies the suggest API, and only to its own instance: never to production's.
  const dials = [...dev.matchAll(/"dial":"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(dials, ["suggest-dev:3001"], dev);
});

test("Caddyfile validates on Caddy 2.6 (host floor, no newer syntax)", () => {
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`,
      "caddy:2.6.2",
      "caddy",
      "validate",
      "--config",
      "/etc/caddy/Caddyfile",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout + result.stderr, /Valid configuration/);
});

test("each site proxies the suggest API to its own instance: dev never depends on production", async () => {
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(`${here}/Caddyfile`, "utf8");
  const block = (host) => {
    const start = text.indexOf(`\n${host} {`);
    assert.notEqual(start, -1, `${host} block`);
    const next = text.indexOf("\n}\n", start);
    return text.slice(start, next);
  };
  const prod = block("zedkit.app");
  const dev = block("dev.zedkit.app");
  assert.match(prod, /reverse_proxy suggest:3001/);
  assert.doesNotMatch(prod, /suggest-dev/);
  assert.match(dev, /handle \/api\/identity\/suggest\*/);
  assert.match(dev, /reverse_proxy suggest-dev:3001/);
  assert.doesNotMatch(dev, /reverse_proxy suggest:3001/);
});

test("the suggest routes cap the request body and every connection has seconds to send its request", () => {
  const result = spawnSync(
    "docker",
    ["run", "--rm", "-v", `${here}/Caddyfile:/etc/caddy/Caddyfile:ro`, "caddy:2", "caddy", "adapt", "--config", "/etc/caddy/Caddyfile"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const config = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  const [server] = Object.values(config.apps.http.servers);
  assert.equal(server.read_header_timeout, 5_000_000_000);
  assert.equal(server.read_timeout, 10_000_000_000);

  const text = JSON.stringify(config);
  const proxies = [...text.matchAll(/"handler":"reverse_proxy"[^]*?"dial":"(suggest(?:-dev)?:3001)"/g)].map((match) => match[1]);
  assert.deepEqual(proxies.sort(), ["suggest-dev:3001", "suggest:3001"]);
  assert.equal([...text.matchAll(/"handler":"request_body","max_size":32000/g)].length, 2, "a body cap in front of each proxy");
  assert.equal([...text.matchAll(/"read_timeout":240000000000/g)].length, 2, "suggest upstream read timeout stays above the provider budget");
  assert.equal([...text.matchAll(/"flush_interval":-1/g)].length, 2, "suggest proxies flush immediately so status events are not buffered");
});
