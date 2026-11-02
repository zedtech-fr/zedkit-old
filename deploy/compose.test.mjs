import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));

function services() {
  const files = ["compose.yaml", "compose.override.yaml", "compose.dev.yaml"].flatMap((file) => ["-f", join(here, file)]);
  const result = spawnSync("docker", ["compose", ...files, "config", "--format", "json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout).services;
}

// The suggest services are the only containers that hold a provider key and run code that reads the open web.
for (const name of ["suggest", "suggest-dev"]) {
  test(`${name} runs with no privileges, no writable image and bounded resources`, () => {
    const service = services()[name];
    assert.ok(service, `${name} is defined`);
    assert.equal(service.read_only, true);
    assert.deepEqual(service.cap_drop, ["ALL"]);
    assert.ok(service.cap_add === undefined || service.cap_add.length === 0, "no capability is added back");
    assert.ok(service.security_opt?.includes("no-new-privileges:true"));
    assert.ok(Number(service.mem_limit) > 0 && Number(service.mem_limit) <= 1024 * 1024 * 1024, "a memory limit of at most 1 GiB");
    assert.ok(service.pids_limit > 0 && service.pids_limit <= 1024, "a process limit");
    assert.equal(service.environment.UV_THREADPOOL_SIZE, "16", "DNS lookups cannot starve the thread pool");
    assert.equal(service.environment.IDENTITY_AI_TRUSTED_PROXIES, "private", "only the proxy on the compose network is believed about the client address");
    assert.equal(service.ports, undefined, "reachable through the proxy only, never published on the host");
    assert.ok(service.volumes.some((volume) => volume.target === "/app" && volume.read_only === true), "the code is mounted read-only");
  });
}
