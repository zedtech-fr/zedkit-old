// Reference pages for an identity brief, fetched as untrusted text.
//
// Scope: this module exists for identity generation and does nothing else. It reads a page, never runs it, and
// returns bounded text and a few design hints (title, description, theme colour, font names). It does not look at
// pictures or render anything: whatever it returns is `analysis: "text-only"`, and callers must say so.
//
// Server-side request forgery (OWASP SSRF prevention cheat sheet), layer by layer:
//   1. The URL is checked before any lookup: https only, default port, no credentials, a plain public-looking
//      hostname (no IP literals, no single-label or internal suffixes).
//   2. Every address the name resolves to must be public. The check runs inside the socket's own `lookup`, so the
//      address that was checked is the address that is connected to: no gap for DNS rebinding.
//   3. Redirects are followed by hand, a few at most, and each hop goes through 1 and 2 again.
//   4. The request carries no cookies, no credentials, no referrer; it asks for no compression (so there is
//      nothing to inflate); the body is read up to a byte cap and the whole fetch has a deadline.
import { BlockList, isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns";
import https from "node:https";

const BLOCKED = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]) {
  BLOCKED.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
]) {
  BLOCKED.addSubnet(net, prefix, "ipv6");
}

/**
 * True only for a globally routable unicast address. Translated and tunnelled IPv6 forms are refused outright, and an
 * IPv4-mapped one (`::ffff:a.b.c.d`) is judged as the IPv4 address it carries. (The list has no `::ffff:0:0/96`
 * entry on purpose: Node's BlockList reads every IPv4 address as a mapped one, so that entry would match them all.)
 */
export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 0) return false;
  const mapped = family === 6 ? /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address) : null;
  if (mapped) return isPublicAddress(mapped[1]);
  if (family === 6 && /^::ffff:/i.test(address)) return false;
  return !BLOCKED.check(address, family === 6 ? "ipv6" : "ipv4");
}

const INTERNAL_SUFFIXES = [".local", ".localhost", ".internal", ".localdomain", ".lan", ".home.arpa", ".corp", ".intranet", ".test", ".example", ".invalid"];

/**
 * @returns {{ ok: true, url: URL } | { ok: false, reason: string }}
 * A reason is a short code for the caller to show; it never echoes the input.
 */
export function checkUrl(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return { ok: false, reason: "invalid-url" };
  if (!URL.canParse(raw)) return { ok: false, reason: "invalid-url" };
  const url = new URL(raw);
  if (url.protocol !== "https:") return { ok: false, reason: "protocol" };
  if (url.username !== "" || url.password !== "") return { ok: false, reason: "credentials" };
  if (url.port !== "") return { ok: false, reason: "port" };
  const host = url.hostname.toLowerCase();
  if (host.startsWith("[") || isIP(host) !== 0) return { ok: false, reason: "ip-literal" };
  const valid = host.length <= 253 && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(host);
  if (!valid || INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) return { ok: false, reason: "hostname" };
  url.hash = "";
  return { ok: true, url };
}

class BlockedAddress extends Error {
  constructor() {
    super("blocked-address");
    this.code = "BLOCKED_ADDRESS";
  }
}

/** The `lookup` the socket uses: refuses the connection when any answer is not public. */
export function guardedLookup(resolve = dnsLookup) {
  return (hostname, options, callback) => {
    resolve(hostname, { all: true, verbatim: true }, (error, addresses) => {
      if (error) return callback(error);
      if (!Array.isArray(addresses) || addresses.length === 0 || addresses.some((entry) => !isPublicAddress(entry.address))) {
        return callback(new BlockedAddress());
      }
      if (options && options.all) return callback(null, addresses);
      return callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

const ACCEPTED_TYPES = /^(text\/html|application\/xhtml\+xml|text\/plain)\b/i;
const USER_AGENT = "ZedkitIdentityReference/1 (+https://zedkit.app)";

/**
 * One GET with the guarded lookup. Resolves with the status, headers and a body capped at `maxBytes` (flagged
 * `truncated`), or rejects. Nothing but plain headers is sent.
 */
export function guardedRequest(url, { resolve, signal, maxBytes }) {
  return new Promise((done, fail) => {
    const request = https.request(
      {
        protocol: "https:",
        host: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        agent: false,
        lookup: guardedLookup(resolve),
        signal,
        headers: { accept: "text/html,text/plain;q=0.8", "accept-encoding": "identity", "user-agent": USER_AGENT },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const headers = response.headers;
        if (status >= 300 && status < 400) {
          response.resume();
          return done({ status, headers, body: Buffer.alloc(0), truncated: false });
        }
        const chunks = [];
        let size = 0;
        let truncated = false;
        response.on("data", (chunk) => {
          if (truncated) return;
          size += chunk.length;
          if (size > maxBytes) {
            truncated = true;
            chunks.push(chunk.subarray(0, chunk.length - (size - maxBytes)));
            response.destroy();
            return;
          }
          chunks.push(chunk);
        });
        response.on("close", () => done({ status, headers, body: Buffer.concat(chunks), truncated }));
        response.on("error", fail);
      },
    );
    request.on("error", fail);
    request.end();
  });
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d{1,6});/g, (_m, code) => (Number(code) < 0x110000 ? String.fromCodePoint(Number(code)) : " "));
}

const squash = (text) => decodeEntities(text).replace(/\s+/g, " ").trim();
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

function meta(html, names) {
  for (const name of names) {
    const pattern = new RegExp(`<meta\\b[^>]*(?:name|property)=["']${name}["'][^>]*>`, "i");
    const tag = pattern.exec(html)?.[0];
    const value = tag ? /content=["']([^"']*)["']/i.exec(tag)?.[1] : undefined;
    if (value) return squash(value);
  }
  return "";
}

/** Font family names a page asks for: from Google Fonts links and inline `font-family`, never fetched. */
function fontNames(html) {
  const found = new Set();
  for (const link of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/gi)) {
    // URLSearchParams decodes without throwing on a malformed escape.
    for (const family of new URLSearchParams(link[1].replace(/&amp;/g, "&")).getAll("family")) found.add(family.split(":")[0] ?? "");
  }
  for (const rule of html.matchAll(/font-family\s*:\s*([^;}"]+)/gi)) {
    const first = rule[1].split(",")[0]?.replace(/["']/g, "").trim();
    if (first && !/^(inherit|initial|unset|serif|sans-serif|monospace|system-ui|var\(.*)$/i.test(first)) found.add(first);
  }
  return [...found].map((name) => name.replace(/[^\w .-]/g, "").slice(0, 40)).filter(Boolean).slice(0, 6);
}

/** The text of a page and a few hints, bounded. Scripts, styles and markup never reach the model. */
export function extractReference(html, maxChars) {
  const title = squash(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|iframe|head)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  return {
    title: clip(title, 120),
    description: clip(meta(html, ["description", "og:description"]), 300),
    themeColor: clip(meta(html, ["theme-color"]), 30),
    fonts: fontNames(html),
    text: clip(squash(body), maxChars),
  };
}

const MAX_REDIRECTS = 3;

/**
 * One reference. Always resolves: a failure is `{ ok: false, reason }`, which the caller shows as it is.
 * `transport` and `resolve` are injection points for tests; the defaults are the guarded ones.
 */
export function fetchReference(rawUrl, { resolve, transport = guardedRequest, timeoutMs, maxBytes, maxChars }) {
  const signal = AbortSignal.timeout(timeoutMs);
  const hop = (current, redirects) => {
    const checked = checkUrl(current);
    if (!checked.ok) return Promise.resolve({ ok: false, reason: checked.reason });
    return transport(checked.url, { resolve, signal, maxBytes }).then((response) => {
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.location;
        if (!location || redirects >= MAX_REDIRECTS) return { ok: false, reason: "redirects" };
        const next = URL.canParse(location, checked.url) ? new URL(location, checked.url).href : "";
        return hop(next, redirects + 1);
      }
      if (response.status !== 200) return { ok: false, reason: `status-${response.status}` };
      if (!ACCEPTED_TYPES.test(String(response.headers["content-type"] ?? ""))) return { ok: false, reason: "content-type" };
      const extracted = extractReference(response.body.toString("utf8"), maxChars);
      if (extracted.text.length === 0 && extracted.title.length === 0) return { ok: false, reason: "empty" };
      return { ok: true, host: checked.url.hostname, ...extracted, truncated: response.truncated };
    });
  };
  return hop(rawUrl, 0).catch((error) => ({ ok: false, reason: reasonOf(error) }));
}

function reasonOf(error) {
  if (error?.code === "BLOCKED_ADDRESS" || error?.message === "blocked-address") return "blocked-address";
  if (error?.name === "TimeoutError" || error?.name === "AbortError" || error?.code === "ABORT_ERR") return "timeout";
  if (error?.code === "ENOTFOUND" || error?.code === "EAI_AGAIN") return "not-found";
  return "unreachable";
}

/**
 * The references of one brief, fetched side by side. Each URL appears once in the answer, in the order given,
 * with the status the visitor will be shown: `used` (with the text) or `failed` (with a reason).
 */
export function fetchReferences(urls, options) {
  const unique = [...new Set(urls)];
  return Promise.all(unique.map((url) => fetchReference(url, options).then((result) => ({ url, ...result }))));
}
