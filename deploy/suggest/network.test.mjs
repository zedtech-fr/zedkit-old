import assert from "node:assert/strict";
import test from "node:test";

import { clientKey, normalizeAddress, trustedList, visitorKey } from "./network.mjs";

const req = (peer, forwarded) => ({ socket: { remoteAddress: peer }, headers: forwarded === undefined ? {} : { "x-forwarded-for": forwarded } });
const compose = trustedList("private");

test("the peer is the visitor when no proxy of ours is in front", () => {
  assert.equal(clientKey(req("203.0.113.9"), trustedList("")), "4:203.0.113.9");
  assert.equal(clientKey(req("::ffff:203.0.113.9"), trustedList("")), "4:203.0.113.9");
});

test("a forwarding header from an untrusted peer is ignored: forging it buys nothing", () => {
  assert.equal(clientKey(req("203.0.113.9", "198.51.100.1"), compose), "4:203.0.113.9");
  assert.equal(clientKey(req("203.0.113.9", "10.0.0.1, 198.51.100.1"), compose), "4:203.0.113.9");
});

test("behind our proxy, the client is the last address that is not ours", () => {
  assert.equal(clientKey(req("172.18.0.2", "203.0.113.9"), compose), "4:203.0.113.9");
  // The caller put a made-up address first; the proxy appended the real one. The real one counts.
  assert.equal(clientKey(req("172.18.0.2", "1.2.3.4, 203.0.113.9"), compose), "4:203.0.113.9");
  assert.equal(clientKey(req("172.18.0.2", "203.0.113.9, 172.18.0.5"), compose), "4:203.0.113.9");
});

test("junk in the header never throws and falls back to the peer", () => {
  assert.equal(clientKey(req("172.18.0.2", "not-an-ip, , <script>"), compose), "4:172.18.0.2");
  assert.equal(clientKey(req(undefined), compose), "unknown:peer");
  assert.equal(clientKey({ socket: {}, headers: { "x-forwarded-for": ["203.0.113.9", "10.1.1.1"] } }, compose), "unknown:peer");
});

test("an IPv6 visitor is keyed on its /64, written the same however it is spelled", () => {
  assert.equal(visitorKey("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), "6:2001:db8:1:2");
  assert.equal(visitorKey("2001:db8:1:2::1"), "6:2001:db8:1:2");
  assert.equal(visitorKey("2001:0db8:0001:0002:0:0:0:9"), "6:2001:db8:1:2");
  assert.equal(visitorKey("2001:db8::1"), "6:2001:db8:0:0");
});

test("explicit trusted proxies replace the private ranges", () => {
  const only = trustedList("172.18.0.2, 2001:db8:ffff::/48");
  assert.equal(clientKey(req("172.18.0.2", "203.0.113.9"), only), "4:203.0.113.9");
  assert.equal(clientKey(req("10.0.0.5", "203.0.113.9"), only), "4:10.0.0.5");
});

test("addresses are normalised and rejected when they are not addresses", () => {
  assert.equal(normalizeAddress("[::1]"), "::1");
  assert.equal(normalizeAddress("fe80::1%eth0"), "fe80::1");
  assert.equal(normalizeAddress("999.1.1.1"), "");
});
