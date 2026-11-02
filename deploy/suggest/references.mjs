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
  ["3fff::", 20],
]) {
  BLOCKED.addSubnet(net, prefix, "ipv6");
}

/** The only IPv6 space handed out as global unicast. Anything outside it is not a public address, listed or not. */
const GLOBAL_V6 = new BlockList();
GLOBAL_V6.addSubnet("2000::", 3, "ipv6");

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
  if (family === 6 && !GLOBAL_V6.check(address, "ipv6")) return false;
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

// Well-formed and free of control characters, so that a field costs at most 3 bytes per UTF-16 unit once serialised
// (a lone surrogate or a control character would be escaped to six). The reservation relies on that bound.
const squash = (text) => decodeEntities(text).toWellFormed().replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim();
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const RAW_TEXT = new Set(["script", "style", "noscript", "template", "svg", "iframe"]);
const MAX_STYLE_CHARS = 20_000;

/** The attributes of one tag's text, scanned once, names lowercased. Linear in the tag's length. */
function attributes(tag) {
  const found = {};
  let i = tag.search(/[\s/]/);
  while (i !== -1 && i < tag.length) {
    while (i < tag.length && /[\s/]/.test(tag[i])) i += 1;
    let j = i;
    while (j < tag.length && !/[\s=/>]/.test(tag[j])) j += 1;
    const name = tag.slice(i, j).toLowerCase();
    i = j;
    while (i < tag.length && /\s/.test(tag[i])) i += 1;
    if (tag[i] !== "=") {
      if (name) found[name] ??= "";
      continue;
    }
    i += 1;
    while (i < tag.length && /\s/.test(tag[i])) i += 1;
    const quote = tag[i] === '"' || tag[i] === "'" ? tag[i] : "";
    if (quote) i += 1;
    let end = i;
    while (end < tag.length && (quote ? tag[end] !== quote : !/[\s>]/.test(tag[end]))) end += 1;
    if (name) found[name] ??= tag.slice(i, end);
    i = end + (quote ? 1 : 0);
  }
  return found;
}

/** The index just past the closing tag of a raw-text element (`</script`), or -1. Case-insensitive, one pass. */
function closeOf(html, name, from) {
  for (let at = html.indexOf("</", from); at !== -1; at = html.indexOf("</", at + 2)) {
    if (html.slice(at + 2, at + 2 + name.length).toLowerCase() === name) return html.indexOf(">", at) === -1 ? html.length : html.indexOf(">", at) + 1;
  }
  return -1;
}

/**
 * A page read once, front to back. Every position is looked at a bounded number of times, so a page built to be
 * slow (a million `<`, an unclosed `<meta`) costs time in proportion to its size and no more. This runs on the
 * service's own thread after a reservation: an extractor that could take minutes would stop every other request.
 */
function scan(html) {
  const metas = {};
  const hrefs = [];
  const style = [];
  const text = [];
  let title = "";
  let titleSeen = false;
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      text.push(html.slice(i));
      break;
    }
    text.push(html.slice(i, lt));
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    const gt = html.indexOf(">", lt);
    if (gt === -1) {
      // No `>` anywhere after this point, so no tag can close: the rest is text. Looking again at every later `<`
      // would re-scan the whole remainder each time.
      text.push(html.slice(lt).replace(/</g, " "));
      break;
    }
    const tag = html.slice(lt + 1, gt);
    const name = /^\/?([a-zA-Z][a-zA-Z0-9-]*)/.exec(tag)?.[1]?.toLowerCase() ?? "";
    i = gt + 1;
    text.push(" ");
    if (tag.startsWith("/") || name === "") continue;
    const attrs = attributes(tag);
    if (attrs.style) style.push(attrs.style);
    if (name === "meta") {
      const key = (attrs.name || attrs.property || "").toLowerCase();
      if (key && attrs.content && metas[key] === undefined) metas[key] = attrs.content;
    } else if (name === "link" && attrs.href) {
      hrefs.push(attrs.href);
    }
    if (name === "title" && !titleSeen) {
      titleSeen = true;
      const end = closeOf(html, "title", i);
      const body = html.slice(i, end === -1 ? Math.min(html.length, i + 400) : end);
      title = body.slice(0, body.indexOf("<") === -1 ? body.length : body.indexOf("<"));
      i = end === -1 ? i : end;
      continue;
    }
    if (RAW_TEXT.has(name)) {
      const end = closeOf(html, name, i);
      if (name === "style") style.push(html.slice(i, Math.min(end === -1 ? html.length : end, i + MAX_STYLE_CHARS)));
      i = end === -1 ? html.length : end;
    }
  }
  return { title, metas, hrefs, style: style.join(";\n").slice(0, MAX_STYLE_CHARS), text: text.join("") };
}

/** Font family names a page asks for: from Google Fonts links and `font-family`, never fetched. */
function fontNames({ hrefs, style }) {
  const found = new Set();
  for (const href of hrefs) {
    if (!/^https?:\/\/fonts\.googleapis\.com\/css2?\?/i.test(href)) continue;
    // URLSearchParams decodes without throwing on a malformed escape.
    for (const family of new URLSearchParams(href.slice(href.indexOf("?") + 1).replace(/&amp;/g, "&")).getAll("family")) found.add(family.split(":")[0] ?? "");
  }
  for (const rule of style.matchAll(/font-family\s*:\s*([^;}"]{1,200})/gi)) {
    const first = rule[1].split(",")[0]?.replace(/["']/g, "").trim();
    if (first && !/^(inherit|initial|unset|serif|sans-serif|monospace|system-ui|var\(.*)$/i.test(first)) found.add(first);
  }
  return [...found].map((name) => name.replace(/[^\w .-]/g, "").slice(0, FIELD_MAX.fontChars)).filter(Boolean).slice(0, FIELD_MAX.fonts);
}

/** The longest each field of a read page can be, in UTF-16 units: the worst case a reservation has to cover. */
export const FIELD_MAX = Object.freeze({ title: 120, description: 300, themeColor: 30, fonts: 6, fontChars: 40 });

/** The text of a page and a few hints, bounded. Scripts, styles and markup never reach the model. */
export function extractReference(html, maxChars) {
  const page = scan(html);
  const pick = (...names) => {
    for (const name of names) if (page.metas[name]) return squash(page.metas[name]);
    return "";
  };
  return {
    title: clip(squash(page.title), FIELD_MAX.title),
    description: clip(pick("description", "og:description"), FIELD_MAX.description),
    themeColor: clip(pick("theme-color"), FIELD_MAX.themeColor),
    fonts: fontNames(page),
    text: clip(squash(page.text), maxChars),
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
