// Reference pages for an identity brief, fetched as untrusted data.
//
// Scope: this module exists for identity generation and does nothing else. It reads a page and up to two of its
// stylesheets, never runs them, and returns bounded text plus design signals measured from the CSS: custom
// properties, dominant colours, font families (Google Fonts links included), radii, shadows, a spacing scale and the
// theme colour. It does not render the page or look at pictures: whatever it returns is
// `analysis: "styles-and-text"`, and callers must say so (never "visual analysis").
//
// Server-side request forgery (OWASP SSRF prevention cheat sheet), layer by layer:
//   1. The URL is checked before any lookup: http or https, default port, no credentials, a plain public-looking
//      hostname (no IP literals, no single-label or internal suffixes), and the kit's own `isPrivateHostname`
//      (`@zedtech/zedkit-server`, ported in `hostname-guard.mjs`).
//   2. Every address the name resolves to must be public, by this module's list and by the kit's. The check runs
//      inside the socket's own `lookup`, so the address that was checked is the address that is connected to: no
//      gap for DNS rebinding.
//   3. Redirects are followed by hand, a few at most, each hop goes through 1 and 2 again, and https never
//      redirects down to http. Stylesheets are fetched through the very same path.
//   4. The request carries no cookies, no credentials, no referrer; it asks for no compression (so there is
//      nothing to inflate); every body is read up to a byte cap and the whole reference (page and stylesheets
//      together) has one deadline.
import { BlockList, isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";

import { isPrivateHostname } from "./hostname-guard.mjs";

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
  if (isPrivateHostname(address)) return false;
  return !BLOCKED.check(address, family === 6 ? "ipv6" : "ipv4");
}

const INTERNAL_SUFFIXES = [".local", ".localhost", ".internal", ".localdomain", ".lan", ".home.arpa", ".corp", ".intranet", ".test", ".example", ".invalid"];

/**
 * @returns {{ ok: true, url: URL } | { ok: false, reason: string }}
 * A reason is a short code for the caller to show; it never echoes the input.
 */
export function checkUrl(raw, { allowHttp = true } = {}) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return { ok: false, reason: "invalid-url" };
  if (!URL.canParse(raw)) return { ok: false, reason: "invalid-url" };
  const url = new URL(raw);
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) return { ok: false, reason: "protocol" };
  if (url.username !== "" || url.password !== "") return { ok: false, reason: "credentials" };
  if (url.port !== "") return { ok: false, reason: "port" };
  const host = url.hostname.toLowerCase();
  if (host.startsWith("[") || isIP(host) !== 0) return { ok: false, reason: "ip-literal" };
  const valid = host.length <= 253 && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(host);
  if (!valid || INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix)) || isPrivateHostname(host)) return { ok: false, reason: "hostname" };
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
const CSS_TYPE = /^text\/css\b/i;
const USER_AGENT = "ZedkitIdentityReference/1 (+https://zedkit.app)";

/**
 * One GET with the guarded lookup. Resolves with the status, headers and a body capped at `maxBytes` (flagged
 * `truncated`), or rejects. Nothing but plain headers is sent.
 */
export function guardedRequest(url, { resolve, signal, maxBytes, accept = "text/html,text/plain;q=0.8" }) {
  const secure = url.protocol === "https:";
  return new Promise((done, fail) => {
    const request = (secure ? https : http).request(
      {
        protocol: secure ? "https:" : "http:",
        host: url.hostname,
        port: secure ? 443 : 80,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        agent: false,
        lookup: guardedLookup(resolve),
        signal,
        headers: { accept, "accept-encoding": "identity", "user-agent": USER_AGENT },
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

const ENTITIES = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

/** One pass, so `&amp;lt;` stays the text `&lt;` instead of being unescaped twice. */
function decodeEntities(text) {
  return text.replace(/&(nbsp|amp|lt|gt|quot|apos|#39|#\d{1,6});/gi, (match, name) => {
    const key = name.toLowerCase();
    if (key in ENTITIES) return ENTITIES[key];
    const code = Number(key.slice(1));
    return code < 0x110000 ? String.fromCodePoint(code) : " ";
  });
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
  const sheets = [];
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
      if (/(?:^|\s)stylesheet(?:\s|$)/i.test(attrs.rel ?? "") && sheets.length < 200) sheets.push(attrs.href);
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
  return { title, metas, hrefs, sheets, style: style.join(";\n").slice(0, MAX_STYLE_CHARS), text: text.join("") };
}

const GENERIC_FONT = /^(inherit|initial|unset|serif|sans-serif|monospace|cursive|fantasy|math|emoji|system-ui|-apple-system|blinkmacsystemfont|ui-[a-z-]+|segoe ui(?: [a-z]+)?|apple color emoji|noto color emoji|helvetica neue|arial|var\(.*)$/i;

/**
 * A family name as a designer would write it. Build tools rename self-hosted fonts (`__Rubik_b539cb`, its
 * `__Rubik_Fallback_b539cb` metric twin): the hash and the fallback are dropped, and generic or system names are
 * not a choice the page made, so they are not reported.
 */
export function cleanFontName(raw) {
  const name = raw
    .replace(/["']/g, "")
    .trim()
    .replace(/^__+/, "")
    .replace(/_[0-9a-f]{5,8}$/i, "")
    .replace(/_/g, " ")
    .trim();
  if (!name || /\bfallback\b/i.test(name) || GENERIC_FONT.test(name)) return "";
  return name;
}

/** Font family names a page asks for: from Google Fonts links and `font-family`, never fetched. */
function fontNames(hrefs, css) {
  const found = new Set();
  for (const href of hrefs) {
    if (!/^https?:\/\/fonts\.googleapis\.com\/css2?\?/i.test(href)) continue;
    // URLSearchParams decodes without throwing on a malformed escape.
    for (const family of new URLSearchParams(href.slice(href.indexOf("?") + 1).replace(/&amp;/g, "&")).getAll("family")) found.add(family.split(":")[0] ?? "");
  }
  for (const rule of css.matchAll(/font-family\s*:\s*([^;}]{1,200})/gi)) {
    const first = rule[1].split(",")[0]?.replace(/["']/g, "").trim();
    const name = cleanFontName(first ?? "");
    if (name) found.add(name);
  }
  return [...found].map((name) => name.replace(/[^\w .-]/g, "").slice(0, FIELD_MAX.fontChars)).filter(Boolean).slice(0, FIELD_MAX.fonts);
}

/** The longest each field of a read page can be, in UTF-16 units: the worst case a reservation has to cover. */
export const FIELD_MAX = Object.freeze({
  title: 120,
  description: 300,
  themeColor: 30,
  fonts: 6,
  fontChars: 40,
  properties: 12,
  propertyChars: 64,
  colors: 8,
  colorChars: 32,
  radii: 4,
  radiusChars: 24,
  shadows: 3,
  shadowChars: 80,
  spacing: 6,
  spacingChars: 10,
  darkColors: 4,
  scheme: 5,
});

/** Stylesheets read per page, and the CSS scanned per reference (inline and linked together). */
export const MAX_STYLESHEETS = 8;
const MAX_CSS_CHARS = 1_000_000;

// A CSS value reaches the prompt only if it is plain: no url(), no quotes, no braces, nothing but the characters
// colours, lengths and shadows are written with. Anything else is dropped, not escaped.
const SAFE_VALUE = /^[#\w\s.,%()/+-]+$/;
const plain = (value, max) => {
  const squashed = value.replace(/!important/gi, "").replace(/\s+/g, " ").trim();
  if (!squashed || squashed.length > max || !SAFE_VALUE.test(squashed) || /url\(|expression/i.test(squashed)) return "";
  return squashed;
};

/** Values by how often they occur, most frequent first; ties keep first-seen order. */
function ranked(values, limit) {
  const counts = new Map();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, limit).map(([value]) => value);
}

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, "0");

/**
 * One colour as a short, comparable string, or "" when it shows nothing. Utility CSS writes its colours with a
 * variable alpha (`rgb(38 80 119/var(--tw-bg-opacity))`): that is an opaque colour, read as hex. A colour with an
 * alpha of 0 is a gradient or transition stop, and Tailwind's default focus ring is the framework's, not the page's.
 */
function normalizeColor(raw) {
  const value = raw.toLowerCase();
  const fn = /^(rgba?|hsla?)\(\s*([\d.]+)(deg)?[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)\s*(?:[,/]\s*(var\([^()]*\)|[\d.]+%?))?\s*\)$/.exec(value);
  if (fn) {
    const alpha = fn[6];
    if (alpha !== undefined && !alpha.startsWith("var(") && Number.parseFloat(alpha) === 0) return "";
    const opaque = alpha === undefined || alpha.startsWith("var(") || Number.parseFloat(alpha) === (alpha.endsWith("%") ? 100 : 1);
    if (fn[1].startsWith("rgb")) {
      if (fn[2] === "59" && fn[4] === "130" && fn[5] === "246") return "";
      if (opaque && !fn[4].endsWith("%")) return `#${hex2(fn[2])}${hex2(fn[4])}${hex2(fn[5])}`;
    } else if (opaque) {
      return `hsl(${fn[2]} ${fn[4]} ${fn[5]})`;
    }
    if (value.includes("var(")) return "";
  }
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) return `#${[...hex.slice(0, 3)].map((c) => c + c).join("")}`;
    return `#${hex.slice(0, 6)}`;
  }
  return value.replace(/\s+/g, " ");
}

// Hex, or a colour function with at most one nested call inside (a `var()` alpha). Bounded, no nested quantifiers.
const COLOUR = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|(?:rgba?|hsla?|oklch)\((?:[^()]{1,40}|[^()]{0,30}\([^()]{0,40}\)[^()]{0,10})\)/g;

const DESIGN_PROPERTY = /color|colour|bg|background|surface|brand|accent|primary|secondary|foreground|text|border|radius|font|shadow|space|spacing|gap/i;

/**
 * Design signals measured from a page's CSS. Every regular expression here has bounded quantifiers and no nesting,
 * so a hostile stylesheet costs linear time, and every list and value is capped by `FIELD_MAX`.
 */
export function designSignals(rawCss, hrefs = []) {
  const css = rawCss.slice(0, MAX_CSS_CHARS);
  // Colour tokens first (they carry the palette), then shape, type and spacing; at most a few of each kind.
  const kinds = { colour: [], shape: [], type: [], space: [] };
  const seen = new Set();
  for (const match of css.matchAll(/(--[\w-]{1,48})\s*:\s*([^;{}]{1,120})/g)) {
    const name = match[1];
    if (seen.has(name) || !DESIGN_PROPERTY.test(name) || /^--tw-/.test(name)) continue;
    const value = plain(match[2], FIELD_MAX.propertyChars - name.length - 2);
    if (!value || /^(var\(|calc\(|initial$|inherit$|unset$|none$|0$|solid$)/i.test(value)) continue;
    seen.add(name);
    const kind = /radius|shadow|border-width/i.test(name) ? "shape" : /font|text-(?:xs|sm|base|md|lg|\d?xl)|size|leading|tracking|letter|line-height|weight/i.test(name) ? "type" : /space|spacing|gap/i.test(name) ? "space" : "colour";
    const list = kinds[kind];
    if (list.length < (kind === "colour" ? 200 : 2)) list.push(`${name}: ${value}`);
    if (seen.size > 5_000) break;
  }
  // Role names (brand, primary, background...) say more than palette names (blue, gray-200).
  const role = (entry) => (/brand|primary|accent|bg|background|surface|foreground|text|border/i.test(entry.split(":")[0]) ? 0 : 1);
  kinds.colour = kinds.colour.map((entry, index) => [role(entry), index, entry]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).slice(0, 6).map(([, , entry]) => entry);
  const properties = [...kinds.colour, ...kinds.shape, ...kinds.type, ...kinds.space].slice(0, FIELD_MAX.properties);
  const colors = ranked(
    [...css.matchAll(COLOUR)].map((m) => plain(normalizeColor(m[0]), FIELD_MAX.colorChars)),
    FIELD_MAX.colors,
  );
  // Colours set under a dark selector (`.dark .x`, Tailwind's `.dark\:bg-x`): the page's own dark palette.
  const darkValues = [];
  // Rules are cut at each "}" and "{" once (linear), never matched by a pattern that could rescan.
  if (/\.dark|data-theme/i.test(css)) {
    for (const piece of css.split("}")) {
      const open = piece.lastIndexOf("{");
      if (open === -1) continue;
      const selector = piece.slice(Math.max(0, open - 400), open);
      if (!/(?:^|[\s,>~+(])\.dark(?:\\:|[\s.:[,)>]|$)|\[data-theme=["']?dark/i.test(selector)) continue;
      for (const m of piece.slice(open + 1, open + 2001).matchAll(COLOUR)) darkValues.push(plain(normalizeColor(m[0]), FIELD_MAX.colorChars));
    }
  }
  const darkColors = ranked(darkValues, FIELD_MAX.darkColors);
  const radii = ranked(
    [...css.matchAll(/border-radius\s*:\s*([^;{}]{1,60})/gi)].map((m) => plain(m[1], FIELD_MAX.radiusChars)).filter((v) => v && !/^(0|0px|inherit|initial|unset)$/i.test(v)),
    FIELD_MAX.radii,
  );
  const shadows = ranked(
    [...css.matchAll(/box-shadow\s*:\s*([^;{}]{1,160})/gi)].map((m) => plain(m[1], FIELD_MAX.shadowChars)).filter((v) => v && !/^(none|inherit|initial|unset)$|^var\(/i.test(v)),
    FIELD_MAX.shadows,
  );
  const lengths = [];
  for (const m of css.matchAll(/(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]{1,6})?\s*:\s*([^;{}]{1,60})/gi)) {
    for (const token of m[1].split(/\s+/)) if (/^\d{1,3}(?:\.\d{1,3})?(?:px|rem)$/.test(token) && !/^0(?:\.0+)?(?:px|rem)$/.test(token)) lengths.push(token);
  }
  const px = (v) => Number.parseFloat(v) * (v.endsWith("rem") ? 16 : 1);
  const spacing = ranked(lengths, FIELD_MAX.spacing).sort((x, y) => px(x) - px(y)).map((v) => v.slice(0, FIELD_MAX.spacingChars));
  return { properties, colors, darkColors, fonts: fontNames(hrefs, css), radii, shadows, spacing };
}

/**
 * The scheme a page opens in: a `light`/`dark` class or `data-theme` on <html>, else `<meta name="color-scheme">`.
 * "" when the page does not say.
 */
function schemeOf(page, html) {
  const root = /<html\b[^>]{0,2000}>/i.exec(html.slice(0, 20_000))?.[0] ?? "";
  const attrs = root ? attributes(root.slice(1, -1)) : {};
  const marks = `${attrs.class ?? ""} ${attrs["data-theme"] ?? ""}`.toLowerCase().split(/\s+/);
  if (marks.includes("dark")) return "dark";
  if (marks.includes("light")) return "light";
  const meta = (page.metas["color-scheme"] ?? "").toLowerCase().trim();
  return meta === "dark" ? "dark" : meta.startsWith("light") ? "light" : "";
}

/** The text of a page and a few hints, bounded. Scripts and markup never reach the model; CSS only as signals. */
export function extractReference(html, maxChars, sheets = []) {
  const page = scan(html);
  const pick = (...names) => {
    for (const name of names) if (page.metas[name]) return squash(page.metas[name]);
    return "";
  };
  const signals = designSignals([page.style, ...sheets].join("\n"), page.hrefs);
  signals.scheme = schemeOf(page, html);
  return {
    title: clip(squash(page.title), FIELD_MAX.title),
    description: clip(pick("description", "og:description"), FIELD_MAX.description),
    themeColor: plain(clip(pick("theme-color"), FIELD_MAX.themeColor), FIELD_MAX.themeColor),
    fonts: signals.fonts,
    signals: { ...signals, stylesheets: sheets.length },
    text: clip(squash(page.text), maxChars),
  };
}

/**
 * The stylesheets worth reading, as absolute URLs (font CSS is read from its link, not fetched). A sheet linked
 * several times is usually the shared one that holds the design tokens, so the most linked come first, then
 * document order.
 */
export function stylesheetUrls(html, base) {
  const counts = new Map();
  for (const href of scan(html).sheets) {
    if (!URL.canParse(href.replace(/&amp;/g, "&"), base)) continue;
    const url = new URL(href.replace(/&amp;/g, "&"), base);
    if (url.hostname === "fonts.googleapis.com" || (url.protocol !== "https:" && url.protocol !== "http:")) continue;
    counts.set(url.href, (counts.get(url.href) ?? 0) + 1);
  }
  return [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, MAX_STYLESHEETS).map(([href]) => href);
}

/** Absolute http(s) links written in free text, in order, without trailing punctuation. */
export function urlsInText(text) {
  const out = [];
  for (const match of String(text).slice(0, 20_000).matchAll(/https?:\/\/[^\s<>"'`]{1,2000}/gi)) {
    const url = match[0].replace(/[).,;:!?\]}]+$/, "");
    if (URL.canParse(url) && !out.includes(url)) out.push(url);
  }
  return out;
}

const MAX_REDIRECTS = 3;
export const STYLESHEET_MAX_BYTES = 196_608;

/**
 * One guarded GET with redirects. Each hop is checked again; once a chain is on https it never goes back to http.
 * Resolves to `{ ok: true, url, response }` or `{ ok: false, reason }`; network errors reject.
 */
function follow(rawUrl, { resolve, transport, signal, maxBytes, accept }) {
  const hop = (current, redirects, secure) => {
    const checked = checkUrl(current, { allowHttp: !secure });
    if (!checked.ok) return Promise.resolve({ ok: false, reason: checked.reason });
    return transport(checked.url, { resolve, signal, maxBytes, accept }).then((response) => {
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.location;
        if (!location || redirects >= MAX_REDIRECTS) return { ok: false, reason: "redirects" };
        const next = URL.canParse(location, checked.url) ? new URL(location, checked.url).href : "";
        return hop(next, redirects + 1, secure || checked.url.protocol === "https:");
      }
      if (response.status !== 200) return { ok: false, reason: `status-${response.status}` };
      return { ok: true, url: checked.url, response };
    });
  };
  return hop(rawUrl, 0, false);
}

/**
 * One reference. Always resolves: a failure is `{ ok: false, reason }`, which the caller shows as it is.
 * `transport` and `resolve` are injection points for tests; the defaults are the guarded ones. The deadline covers
 * the page and its stylesheets; a stylesheet that fails is skipped, the page still counts.
 */
export function fetchReference(rawUrl, { resolve, transport = guardedRequest, timeoutMs, maxBytes, maxChars, sheetMaxBytes = STYLESHEET_MAX_BYTES }) {
  const signal = AbortSignal.timeout(timeoutMs);
  const page = follow(rawUrl, { resolve, transport, signal, maxBytes, accept: "text/html,text/plain;q=0.8" }).then(async (result) => {
    if (!result.ok) return result;
    const { url, response } = result;
    if (!ACCEPTED_TYPES.test(String(response.headers["content-type"] ?? ""))) return { ok: false, reason: "content-type" };
    const html = response.body.toString("utf8");
    const sheets = await Promise.all(
      stylesheetUrls(html, url).map((sheet) =>
        follow(sheet, { resolve, transport, signal, maxBytes: sheetMaxBytes, accept: "text/css" })
          .then((r) => (r.ok && CSS_TYPE.test(String(r.response.headers["content-type"] ?? "")) ? r.response.body.toString("utf8") : null))
          .catch(() => null),
      ),
    );
    const extracted = extractReference(html, maxChars, sheets.filter((sheet) => sheet !== null));
    if (extracted.text.length === 0 && extracted.title.length === 0) return { ok: false, reason: "empty" };
    return { ok: true, host: url.hostname, ...extracted, truncated: response.truncated };
  });
  return page.catch((error) => ({ ok: false, reason: reasonOf(error) }));
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
