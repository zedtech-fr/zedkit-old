import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

import { isPrivateHostname } from "./hostname-guard.mjs";

const SERVER_DIST = join(dirname(fileURLToPath(import.meta.url)), "../../packages/server/dist/index.js");

// The service ports the kit's host guard; this test keeps the port honest. It needs the built kit
// (`pnpm --filter @zedtech/zedkit-server build`, which CI runs before this suite).
assert.ok(existsSync(SERVER_DIST), `build @zedtech/zedkit-server first: ${SERVER_DIST} is missing`);
const kit = await import(pathToFileURL(SERVER_DIST).href);

const HOSTS = [
  "linear.app", "example.org", "localhost", "LOCALHOST.", "a.localhost", "metadata.google.internal", "printer.local", "x.internal", "intranet",
  "127.0.0.1", "127.1", "0x7f.1", "017700000001", "2130706433", "0", "0.0.0.0", "10.0.0.1", "172.16.0.1", "172.32.0.1", "192.168.0.1",
  "169.254.169.254", "100.64.0.1", "100.128.0.1", "198.18.0.1", "224.0.0.1", "255.255.255.255", "8.8.8.8", "93.184.216.34", "1.2.3",
  "::", "::1", "[::1]", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:8.8.8.8", "64:ff9b::a00:1",
  "2001:db8::1", "2606:4700::1111", "2001:4860:4860::8888", "1::2::3", "", ".", "[", "]", "1.2.3.4.5", "999.1.1.1", "0x100.0.0.1",
];

test("the ported host guard answers exactly as the kit's isPrivateHostname", () => {
  for (const host of HOSTS) assert.equal(isPrivateHostname(host), kit.isPrivateHostname(host), host);
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) >>> 0);
  for (let i = 0; i < 2_000; i += 1) {
    const v4 = [next() % 256, next() % 256, next() % 256, next() % 256].join(".");
    const v6 = Array.from({ length: 8 }, () => (next() % 65536).toString(16)).join(":");
    for (const host of [v4, v6, `::ffff:${v4}`]) assert.equal(isPrivateHostname(host), kit.isPrivateHostname(host), host);
  }
});
