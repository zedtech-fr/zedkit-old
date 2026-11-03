// The kit's host guard, ported. `@zedtech/zedkit-server` exports `isPrivateHostname` (packages/server/src/endpoint-url.ts);
// this service is plain Node with no workspace dependencies (it is copied to the host as-is), so it carries the same
// function as JavaScript. `hostname-guard.parity.test.mjs` runs both on the same inputs and fails on any difference:
// change the kit, port it here, keep parity green. Never loosen this side alone.
//
// It is one layer of the reference fetcher's guard, not the whole of it: `references.mjs` also checks every resolved
// address inside the socket's own lookup (the kit's function does not resolve names, so it cannot see DNS rebinding).

function parseIPv4Part(part) {
  if (part.length === 0) return null;
  let base = 10;
  let digits = part;
  if (/^0x[0-9a-f]+$/i.test(part)) {
    base = 16;
    digits = part.slice(2);
  } else if (/^0[0-9]+$/.test(part)) {
    base = 8;
  } else if (!/^[0-9]+$/.test(part)) {
    return null;
  }
  const value = Number.parseInt(digits, base);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/** Parse dotted/squeezed IPv4 (decimal, octal, hex parts) to a 32-bit int. */
function parseIPv4(host) {
  const parts = host.split(".");
  if (parts.length < 1 || parts.length > 4) return null;
  const numbers = [];
  for (const part of parts) {
    const value = parseIPv4Part(part);
    if (value === null) return null;
    numbers.push(value);
  }
  const [a = 0, b = 0, c = 0, d = 0] = numbers;
  if (
    numbers.length === 4 &&
    (a > 255 || b > 255 || c > 255 || d > 255)
  ) {
    return null;
  }
  if (numbers.length === 3 && (a > 255 || b > 255 || c > 65535)) return null;
  if (numbers.length === 2 && (a > 255 || b > 16777215)) return null;
  if (numbers.length === 1 && (a) > 4294967295) return null;
  switch (numbers.length) {
    case 1:
      return a;
    case 2:
      return ((a) << 24) + (b);
    case 3:
      return ((a) << 24) + ((b) << 16) + (c);
    default:
      return (
        (((a) << 24) >>> 0) +
        ((b) << 16) +
        ((c) << 8) +
        (d)
      );
  }
}

const V4_PRIVATE = [
  [0x00000000, 8], // 0.0.0.0/8 "this network"
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10 CGNAT
  [0x7f000000, 8], // 127.0.0.0/8 loopback
  [0xa9fe0000, 16], // 169.254.0.0/16 link-local (cloud metadata lives here)
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0000000, 24], // 192.0.0.0/24
  [0xc0000200, 24], // 192.0.2.0/24 documentation
  [0xc0586300, 24], // 192.88.99.0/24 6to4 relay (deprecated, still special)
  [0xc0a80000, 16], // 192.168.0.0/16
  [0xc6336400, 24], // 198.51.100.0/24 documentation
  [0xcb007100, 24], // 203.0.113.0/24 documentation
  [0xe0000000, 4], // 224.0.0.0/4 multicast
  [0xf0000000, 4], // 240.0.0.0/4 reserved
];

function inCidr(addr, net, bits) {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (((addr >>> 0) & mask) >>> 0) === (((net >>> 0) & mask) >>> 0);
}

function isPrivateIPv4(addr) {
  return V4_PRIVATE.some(([net, bits]) => inCidr(addr >>> 0, net, bits));
}

function expandIPv6(host) {
  const halves = host.split("::");
  if (halves.length > 2) return null;
  const parseGroup = (group) => {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
    return Number.parseInt(group, 16);
  };
  const head = halves[0] === "" ? [] : (halves[0]).split(":");
  const tail =
    halves.length === 2 ? ((halves[1] === "" ? [] : (halves[1]).split(":"))) : [];
  // A dotted IPv4 tail fills two 16-bit groups, not one.
  const width = (parts) =>
    parts.reduce((n, part) => n + (part.includes(".") ? 2 : 1), 0);
  if (halves.length === 1 && width(head) !== 8) return null;
  const missing = 8 - width(head) - width(tail);
  if (halves.length === 2 && missing < 0) return null;
  const groups = [];
  for (const part of [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail]) {
    // Embedded IPv4 tail (e.g. ::ffff:127.0.0.1).
    if (part.includes(".")) {
      const v4 = parseIPv4(part);
      if (v4 === null) return null;
      groups.push((v4 >>> 16) & 0xffff, v4 & 0xffff);
      continue;
    }
    const value = parseGroup(part);
    if (value === null) return null;
    groups.push(value);
  }
  return groups.length === 8 ? groups : null;
}

function isPrivateIPv6(host) {
  if (host.includes("%")) return true; // Zone-scoped => link-local context.
  const groups = expandIPv6(host);
  if (!groups) return true; // Unparseable address literal: fail closed.
  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] = groups;
  if (groups.every((g) => g === 0)) return true; // ::
  if (g7 === 1 && groups.slice(0, 7).every((g) => g === 0)) return true; // ::1
  if ((g0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xffff) {
    return isPrivateIPv4((g6 << 16) + g7); // ::ffff:a.b.c.d mapped
  }
  if ((g0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g0 === 0x2001 && g1 === 0x0db8) return true; // 2001:db8::/32 documentation
  // IPv4 embedded in other forms: judge the embedded address.
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0) {
    return isPrivateIPv4((g6 << 16) + g7); // ::a.b.c.d IPv4-compatible
  }
  if (g0 === 0x0064 && g1 === 0xff9b && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0) {
    return isPrivateIPv4((g6 << 16) + g7); // 64:ff9b::/96 NAT64
  }
  if (g0 === 0x2002) return isPrivateIPv4((g1 << 16) + g2); // 2002::/16 6to4
  return false;
}

/**
 * True when the hostname must never receive outbound traffic: loopback,
 * private, link-local, reserved ranges, or special-use names. Accepts a
 * bare host or a bracketed IPv6 literal (`[::1]`). Ordinary DNS names return
 * false here WITHOUT resolving them: DNS rebinding (a name that resolves to
 * a private address at send time) is NOT covered, so pin the resolved
 * address when you connect if that matters to you.
 *
 * Dependency-free on purpose: the parser handles decimal, octal and hex
 * IPv4 parts, short forms, and IPv6 with embedded IPv4 (mapped,
 * compatible, NAT64, 6to4).
 */
export function isPrivateHostname(hostname) {
  const host = trimTrailingDots(unbracket(hostname.toLowerCase()));
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".invalid") ||
    host.endsWith(".test")
  ) {
    return true;
  }
  if (host.includes(":")) return isPrivateIPv6(host);
  const v4 = parseIPv4(host);
  if (v4 !== null) return isPrivateIPv4(v4);
  return false;
}

// Linear scans instead of `/\.+$/`, which backtracks quadratically on long dotted input.
function trimTrailingDots(host) {
  let end = host.length;
  while (end > 0 && host.charCodeAt(end - 1) === 46) end -= 1;
  return host.slice(0, end);
}

function unbracket(host) {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}
