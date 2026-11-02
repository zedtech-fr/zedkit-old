// Who is asking: the client address the limits are keyed on.
//
// The socket's peer address is the truth. A forwarding header is believed only when the peer is a proxy we run
// (a trusted one), and then only for the part that proxy appended: the chain is read from the right, skipping
// trusted proxies, and the first address that is not one of ours is the client. Anything a caller put at the
// left of the header, or sent with no proxy in front, changes nothing.
import { BlockList, isIP } from "node:net";

const PRIVATE_RANGES = [
  ["127.0.0.0", 8, "ipv4"],
  ["10.0.0.0", 8, "ipv4"],
  ["172.16.0.0", 12, "ipv4"],
  ["192.168.0.0", 16, "ipv4"],
  ["::1", 128, "ipv6"],
  ["fc00::", 7, "ipv6"],
];

/** Parses "private" (loopback and private ranges: the compose network) or a comma list of IPs and CIDRs. */
export function trustedList(spec) {
  const list = new BlockList();
  const text = String(spec ?? "").trim();
  if (text === "") return list;
  for (const item of text.split(",").map((part) => part.trim()).filter(Boolean)) {
    if (item === "private") {
      for (const [net, prefix, family] of PRIVATE_RANGES) list.addSubnet(net, prefix, family);
      continue;
    }
    const [address, prefix] = item.split("/");
    const family = isIP(address) === 6 ? "ipv6" : "ipv4";
    if (!isIP(address)) continue;
    if (prefix === undefined) list.addAddress(address, family);
    else list.addSubnet(address, Number(prefix), family);
  }
  return list;
}

/** `::ffff:1.2.3.4` is 1.2.3.4. Returns "" for anything that is not an address. */
export function normalizeAddress(raw) {
  const text = String(raw ?? "").trim().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(text);
  const address = mapped ? mapped[1] : text;
  return isIP(address) ? address.toLowerCase() : "";
}

function isTrusted(address, trusted) {
  return trusted.check(address, isIP(address) === 6 ? "ipv6" : "ipv4");
}

/** Limits key on the address, and an IPv6 visitor on its /64: a whole household or hosting slot is one visitor. */
export function visitorKey(address) {
  if (isIP(address) === 4) return `4:${address}`;
  const groups = address.split(":");
  if (address.includes("::")) {
    const [head, tail] = address.split("::");
    const left = head === "" ? [] : head.split(":");
    const right = tail === "" ? [] : tail.split(":");
    const full = [...left, ...Array(8 - left.length - right.length).fill("0"), ...right];
    return `6:${full.slice(0, 4).map((g) => Number.parseInt(g || "0", 16).toString(16)).join(":")}`;
  }
  return `6:${groups.slice(0, 4).map((g) => Number.parseInt(g || "0", 16).toString(16)).join(":")}`;
}

/** The wider network a visitor key belongs to: an IPv6 /64 sits in a /48 (one site), an IPv4 address is its own network. */
export function networkOf(key) {
  return key.startsWith("6:") ? key.split(":").slice(0, 4).join(":") : key;
}

/**
 * @param {{ socket: { remoteAddress?: string }, headers: Record<string, string | string[] | undefined> }} req
 * @param {BlockList} trusted
 * @returns {string} the visitor key, or "unknown:peer" when the peer has no usable address (it then shares one bucket)
 */
export function clientKey(req, trusted) {
  const peer = normalizeAddress(req.socket?.remoteAddress);
  if (!peer) return "unknown:peer";
  if (!isTrusted(peer, trusted)) return visitorKey(peer);
  const header = req.headers["x-forwarded-for"];
  const chain = (Array.isArray(header) ? header.join(",") : String(header ?? ""))
    .split(",")
    .map(normalizeAddress)
    .filter(Boolean);
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    if (!isTrusted(chain[i], trusted)) return visitorKey(chain[i]);
  }
  return visitorKey(peer);
}
