import { describe, expect, it } from "vitest";
import { checkEndpointUrl, isPrivateHostname } from "#index.js";

describe("isPrivateHostname", () => {
  it.each([
    "127.0.0.1",
    "127.1",
    "10.0.0.5",
    "100.64.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "localhost",
    "api.localhost",
    "svc.local",
    "svc.internal",
    "box.test",
    "x.invalid",
    "::",
    "::1",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "ff02::1",
    "2001:db8::1",
    "::ffff:127.0.0.1",
    "::ffff:10.1.2.3",
    "::ffff:7f00:1",
    "::127.0.0.1",
    "64:ff9b::7f00:1",
    "2002:7f00:1::1",
    "[::1]",
    "[fe80::1]",
    "fe80::1%eth0",
  ])("treats %s as private", (host) => {
    expect(isPrivateHostname(host)).toBe(true);
  });

  it.each([
    "2130706433", // decimal 127.0.0.1
    "0x7f.0.0.1",
    "0177.0.0.1", // octal 127.0.0.1
    "0x7f000001",
    "10.1",
    "192.168.257",
  ])("sees through the IPv4 spelling %s", (host) => {
    expect(isPrivateHostname(host)).toBe(true);
  });

  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "172.15.255.255",
    "172.32.0.1",
    "192.167.1.1",
    "100.63.255.255",
    "example.com",
    "hooks.example.org",
    "localhost.example.com",
    "2606:4700:4700::1111",
    "[2606:4700:4700::1111]",
    "::ffff:8.8.8.8",
    "64:ff9b::808:808",
    "2002:808:808::1",
  ])("treats %s as public", (host) => {
    expect(isPrivateHostname(host)).toBe(false);
  });

  it("fails closed on malformed IPv6 literals", () => {
    for (const host of ["::1::2", "1:2:3", "gggg::1", ":::", "1:2:3:4:5:6:7:8:9"]) {
      expect(isPrivateHostname(host)).toBe(true);
    }
  });

  it("stays fast on very long dotted input", () => {
    const start = Date.now();
    expect(isPrivateHostname(`a${".".repeat(200_000)}b`)).toBe(false);
    expect(isPrivateHostname(`${".".repeat(200_000)}x`)).toBe(false);
    expect(Date.now() - start).toBeLessThan(1_000);
  });

  it("strips trailing dots before judging", () => {
    expect(isPrivateHostname("localhost.")).toBe(true);
    expect(isPrivateHostname("localhost..")).toBe(true);
    expect(isPrivateHostname("LOCALHOST")).toBe(true);
    expect(isPrivateHostname("example.com.")).toBe(false);
  });
});

describe("checkEndpointUrl", () => {
  it("accepts public https/http URLs", () => {
    expect(checkEndpointUrl("https://hooks.example.com/x").ok).toBe(true);
    expect(checkEndpointUrl("http://8.8.8.8:8080/hook", {}).ok).toBe(true);
    expect(checkEndpointUrl("https://[2606:4700:4700::1111]/hook").ok).toBe(true);
  });

  it("returns an undefined value on success", () => {
    expect(checkEndpointUrl("https://hooks.example.com/x")).toEqual({ ok: true, value: undefined });
  });

  it("rejects non-http schemes and garbage", () => {
    for (const bad of ["ftp://x/y", "file:///etc/passwd", "gopher://example.com", "not a url", ""]) {
      expect(checkEndpointUrl(bad).ok).toBe(false);
    }
  });

  it("rejects private targets unless explicitly allowed", () => {
    for (const url of [
      "http://127.0.0.1:3000/hook",
      "http://localhost:3000/hook",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/hook",
      "http://[::ffff:127.0.0.1]/hook",
    ]) {
      expect(checkEndpointUrl(url).ok).toBe(false);
      expect(checkEndpointUrl(url, { allowPrivate: true }).ok).toBe(true);
    }
  });

  it("judges the address the URL parser resolves, not the spelling", () => {
    for (const url of [
      "http://2130706433/",
      "http://0x7f.1/",
      "http://0177.0.0.1/",
      "http://127.1/",
      "http://localhost./",
      "http://user:pass@127.0.0.1/",
    ]) {
      expect(checkEndpointUrl(url).ok).toBe(false);
    }
  });

  it("explains itself for humans and agents", () => {
    const refused = checkEndpointUrl("http://10.0.0.5/hook");
    expect(!refused.ok && refused.error.message).toMatch(/private|loopback|reserved/i);
    const scheme = checkEndpointUrl("ftp://example.com/x");
    expect(!scheme.ok && scheme.error.message).toMatch(/http or https/);
    const garbage = checkEndpointUrl("nope");
    expect(!garbage.ok && garbage.error).toBeInstanceOf(Error);
  });
});
