import { createHash } from "node:crypto";
// POST /api/identity/suggest: a brief (and optional reference pages) in, a validated identity patch out.
//
// Order of the work is the point of this file. Everything that can refuse a request runs before anything that
// costs money, and a refusal never reaches the provider:
//   switched off or not configured -> kill switch -> same-origin -> burst limit -> body size and shape -> the
//   current tokens -> ledger reservation (concurrency, per-visitor and global limits, daily and monthly budget,
//   duplicate request id) -> references -> provider -> settle.
// The reservation is made at the worst case the calls could cost and settled to what the provider reports. The
// provider is called at most twice (the primary, then the fallback once, only after a transport failure or a
// refusal), never again for invalid output.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { HARD, actualMicro, loadConfig, worstCaseMicro } from "./config.mjs";
import { openLedgerSafely } from "./ledger.mjs";
import { clientKey, networkOf, trustedList } from "./network.mjs";
import { buildMessages, inputBytes, inputTokens, worstCaseReferences } from "./prompt.mjs";
import { callProvider, callProviderStream, parseJson } from "./provider.mjs";
import { applyDelta, openSse, startHeartbeat, wantsStream, writeSse } from "./sse.mjs";
import { fetchReferences, urlsInText } from "./references.mjs";
import { fontsAllowed, mergePatch, validateTokens } from "./tokens.mjs";

const COOKIE = "zk_sid";
const PATH = "/api/identity/suggest";

function send(res, status, body, headers = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json),
    "cache-control": "no-store",
    ...headers,
  });
  res.end(json);
}

function refuse(res, status, error, extra = {}, retryAfterSec, headers = {}) {
  send(res, status, { error, ...extra, ...(retryAfterSec ? { retryAfterSec } : {}) }, { ...(retryAfterSec ? { "retry-after": String(retryAfterSec) } : {}), ...headers });
}

/** Refuses an oversized body and closes the connection once the refusal is out, without reading the rest. */
function tooLarge(req, res) {
  res.on("finish", () => req.destroy());
  refuse(res, 413, "size", {}, undefined, { connection: "close" });
}

function releaseId(env) {
  const path = fileURLToPath(new URL("./release.json", import.meta.url));
  if (existsSync(path)) {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (parsed && typeof parsed.id === "string" && parsed.id) return parsed.id;
  }
  const fromEnv = env.SUGGEST_RELEASE;
  return typeof fromEnv === "string" && fromEnv ? fromEnv : "unknown";
}

/** Why paid generation is off, as a short code the page can word. Null when it can run. */
function unavailableReason(config, ledger) {
  if (config.problems.some((problem) => problem.startsWith("IDENTITY_AI_ENABLED"))) return "disabled";
  if (config.problems.length > 0) return "not-configured";
  // No ledger means no way to hold a budget: paid generation stays off, whatever else is configured.
  if (!ledger) return "unavailable";
  if (ledger.killed()) return "killed";
  return null;
}

function readBody(req, maxBytes) {
  return new Promise((done) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      done(value);
    };
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        // Stop reading; the caller answers, then drops the connection, so the client can read the refusal.
        req.pause();
        finish({ tooLarge: true });
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => finish({ text: Buffer.concat(chunks).toString("utf8") }));
    req.on("error", () => finish({ text: null }));
  });
}

const isText = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;

/** The request, checked field by field. A bad field is named; the value never is. */
export function parseRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, field: "body" };
  if (typeof value.requestId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(value.requestId)) return { ok: false, field: "requestId" };
  if (!isText(value.prompt, HARD.maxPromptChars)) return { ok: false, field: "prompt" };
  const history = value.history ?? [];
  if (!Array.isArray(history) || history.length > HARD.maxHistoryTurns) return { ok: false, field: "history" };
  for (const turn of history) {
    if (!turn || (turn.role !== "user" && turn.role !== "assistant") || !isText(turn.text, HARD.maxTurnChars)) return { ok: false, field: "history" };
  }
  const references = value.references ?? [];
  if (!Array.isArray(references) || references.length > HARD.maxReferences || references.some((url) => typeof url !== "string" || url.length > 2048)) {
    return { ok: false, field: "references" };
  }
  const current = validateTokens(value.current);
  if (!current) return { ok: false, field: "current" };
  return {
    ok: true,
    value: {
      requestId: value.requestId,
      prompt: value.prompt.trim(),
      history: history.map((turn) => ({ role: turn.role, text: turn.text.trim() })),
      // Links written in the brief count as references too, after the explicit ones, still at most three.
      references: [...new Set([...references.map((url) => url.trim()).filter(Boolean), ...urlsInText(value.prompt)])].slice(0, HARD.maxReferences),
      current,
    },
  };
}

function sessionCookie(req, secret) {
  const header = String(req.headers.cookie ?? "");
  const match = new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{16,64})\\.([A-Za-z0-9_-]{20,64})`).exec(header);
  const sign = (id) => createHmac("sha256", secret).update(id).digest("base64url");
  if (match) {
    const expected = Buffer.from(sign(match[1]));
    const given = Buffer.from(match[2]);
    if (expected.length === given.length && timingSafeEqual(expected, given)) return { id: match[1], fresh: false, sign };
  }
  const id = randomBytes(18).toString("base64url");
  return { id, fresh: true, sign };
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  const host = String(req.headers.host ?? "");
  return URL.canParse(String(origin)) && new URL(String(origin)).host === host;
}

/** A fast, in-memory burst limiter. Not the authority (the ledger is): it only keeps a flood off the database. */
function burstLimiter(perMinute, now) {
  const seen = new Map();
  return (key) => {
    const minute = Math.floor(now() / 60_000);
    if (seen.size > 10_000) seen.clear();
    const entry = seen.get(key);
    if (!entry || entry.minute !== minute) {
      seen.set(key, { minute, n: 1 });
      return true;
    }
    entry.n += 1;
    return entry.n <= perMinute;
  };
}

function changedPaths(before, after) {
  const paths = [];
  for (const key of Object.keys(after)) {
    if (key === "light" || key === "dark") {
      for (const sub of Object.keys(after[key])) if (before[key][sub] !== after[key][sub]) paths.push(`${key}.${sub}`);
    } else if (before[key] !== after[key]) paths.push(key);
  }
  return paths;
}

/** One provider call within the deadline, abortable by the client's disconnect. */
function attempt(provider, args, { client, deadline, now, fetchImpl, limits, effort = provider.effort, onDelta }) {
  const remaining = deadline - now();
  if (remaining < 1_000) return Promise.resolve({ ok: false, kind: "timeout", billable: false });
  const signal = AbortSignal.any([AbortSignal.timeout(remaining), client.signal]);
  const call = onDelta ? callProviderStream : callProvider;
  return call(provider, { ...args, maxTokens: limits.maxOutputTokens, signal, fetchImpl, effort, ...(onDelta ? { onDelta } : {}) });
}

/** What the call cost. A reply is charged at its (believable) reported usage; a failure at the worst case only if it may have run. */
function costOf(provider, result, worst, sizes) {
  if (result.ok) return actualMicro(provider, result.usage, worst, { inputBytes: sizes.inputBytes, outputBytes: Buffer.byteLength(result.content) });
  return result.billable ? worst : 0;
}

/** The primary, then the fallback if there is one: never more than the hard ceiling of calls. */
// Only configured providers: with no primary (generation off) there is nothing to call, and nothing to dereference.
const providersOf = (config) => [config.primary, config.fallback].filter(Boolean).slice(0, HARD.maxProviderCalls);

/** A refusal or a transport failure can try the fallback once. Invalid output, or the visitor leaving, cannot. */
function mayFallBack(result) {
  if (result.ok) return false;
  if (result.kind === "aborted") return false;
  if (result.kind === "http") return result.status === 429 || (result.status ?? 0) >= 500;
  return result.kind === "network" || result.kind === "timeout" || result.kind === "shape";
}

async function generate(ctx, request, references) {
  const { config, fetchImpl, now, client, deadline } = ctx;
  const messages = buildMessages({ ...request, references: references.filter((item) => item.ok) });
  const providers = providersOf(config);
  const tokens = inputTokens(messages);
  const sizes = { inputBytes: inputBytes(messages) };
  let spent = 0;
  let called = 0;
  let last = null;
  for (const provider of providers) {
    const worst = worstCaseMicro(provider, tokens, config.limits.maxOutputTokens);
    let result = await attempt(provider, { messages }, { client, deadline, now, fetchImpl, limits: config.limits, onDelta: ctx.onDelta });
    called += 1;
    if (
      !result.ok &&
      result.kind === "http" &&
      result.status >= 400 &&
      result.status < 500 &&
      result.status !== 429 &&
      provider.effort
    ) {
      result = await attempt(provider, { messages }, { client, deadline, now, fetchImpl, limits: config.limits, effort: "", onDelta: ctx.onDelta });
      called += 1;
    }
    spent += costOf(provider, result, worst, sizes);
    last = { result, provider };
    if (result.ok || !mayFallBack(result)) break;
  }
  return { ...last, spent, called };
}

/** The model's text to validated tokens, or a reason. One shot: there is no second ask for a better answer. */
async function interpret(content, current) {
  const outer = await parseJson(content);
  const patch = outer.ok ? outer.value?.tokens : undefined;
  if (!outer.ok || !patch || typeof patch !== "object" || Array.isArray(patch)) return { ok: false };
  const merged = mergePatch(current, patch);
  if (!merged || !fontsAllowed(merged, current)) return { ok: false };
  const summary = typeof outer.value.summary === "string" ? outer.value.summary.trim().slice(0, 600) : "";
  return { ok: true, tokens: merged, summary };
}

function referenceReport(items) {
  return items.map((item) =>
    item.ok
      ? {
          url: item.url,
          status: "used",
          analysis: "styles-and-text",
          host: item.host,
          title: item.title,
          chars: item.text.length,
          hints: {
            themeColor: item.themeColor,
            fonts: item.fonts,
            colors: item.signals.colors.slice(0, 5),
            radius: item.signals.radii[0] ?? "",
            properties: item.signals.properties.length,
            shadows: item.signals.shadows.length,
            stylesheets: item.signals.stylesheets,
          },
        }
      : { url: item.url, status: "failed", reason: item.reason },
  );
}


function deltaWriter(res) {
  let state = { raw: "", emitted: "" };
  let announced = "picking-palette";
  return (delta) => {
    state = applyDelta(state, delta);
    if (state.stage !== announced) {
      announced = state.stage;
      writeSse(res, "status", { stage: state.stage });
    }
    if (state.added) writeSse(res, "text", { delta: state.added });
  };
}

async function finishStream(res, { outcome, request, references, release, log, base }) {
  if (!outcome.result.ok) {
    log({ outcome: `upstream-${outcome.result.kind}`, ...base, ...(outcome.result.status ? { status: outcome.result.status, detail: outcome.result.detail } : {}) });
    if (outcome.result.kind === "aborted") {
      if (!res.writableEnded) res.end();
      return;
    }
    writeSse(res, "error", { error: outcome.result.kind === "timeout" ? "timeout" : "upstream", references: referenceReport(references) });
    res.end();
    return;
  }
  const answer = await interpret(outcome.result.content, request.current);
  if (!answer.ok) {
    log({ outcome: "invalid-output", ...base });
    writeSse(res, "error", { error: "invalid-output", references: referenceReport(references) });
    res.end();
    return;
  }
  log({ outcome: "ok", ...base, changed: changedPaths(request.current, answer.tokens).length });
  writeSse(res, "status", { stage: "building-preview" });
  writeSse(res, "complete", {
    requestId: request.requestId,
    summary: answer.summary,
    tokens: answer.tokens,
    changed: changedPaths(request.current, answer.tokens),
    references: referenceReport(references),
    release: release.id,
  });
  res.end();
}

async function suggest(ctx, req, res) {
  const { config, ledger, trusted, burst, now, log, release } = ctx;
  const started = now();
  const reason = unavailableReason(config, ledger);
  if (reason) return refuse(res, 503, "disabled", { reason });
  if (!sameOrigin(req)) return refuse(res, 403, "origin");
  const key = clientKey(req, trusted);
  if (!burst(key)) return refuse(res, 429, "rate", {}, 30);
  if (Number(req.headers["content-length"]) > HARD.maxBodyBytes) return tooLarge(req, res);
  const body = await readBody(req, HARD.maxBodyBytes);
  if (body.tooLarge) return tooLarge(req, res);
  const json = await parseJson(body.text ?? "");
  const parsed = json.ok ? parseRequest(json.value) : { ok: false, field: "body" };
  if (!parsed.ok) return refuse(res, 400, "body", { field: parsed.field });
  const request = parsed.value;

  const session = sessionCookie(req, ctx.sessionSecret);
  const setCookie = session.fresh
    ? { "set-cookie": `${COOKIE}=${session.id}.${session.sign(session.id)}; Path=/api/identity; Max-Age=2592000; HttpOnly; SameSite=Lax${req.headers["x-forwarded-proto"] === "https" ? "; Secure" : ""}` }
    : {};

  const tokens = inputTokens(buildMessages({ ...request, references: worstCaseReferences(request.references) }));
  const amountMicro = providersOf(config).reduce((sum, provider) => sum + worstCaseMicro(provider, tokens, config.limits.maxOutputTokens), 0);
  const admitted = await ledger
    .reserve({
    requestId: request.requestId,
    ip: key,
    net: networkOf(key),
    session: session.id,
    amountMicro,
    ttlMs: config.limits.timeoutMs + config.limits.referenceTimeoutMs + 15_000,
    budget: config.budget,
    limits: config.limits,
  })
    // A ledger that errors mid-request cannot hold the budget: refuse, before any provider call.
    .catch(() => ({ ok: false, reason: "unavailable", retryAfterSec: 30 }));
  if (!admitted.ok) {
    const map = { duplicate: [409, "duplicate"], busy: [429, "busy"], rate: [429, "rate"], budget: [429, "quota"], unavailable: [503, "disabled"] }[admitted.reason];
    log({ outcome: `refused-${admitted.reason}`, ms: now() - started });
    return refuse(res, map[0], map[1], admitted.reason === "unavailable" ? { reason: "unavailable" } : {}, admitted.retryAfterSec, setCookie);
  }

  const client = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) client.abort();
  });
  const deadline = started + config.limits.timeoutMs + config.limits.referenceTimeoutMs;
  const stream = wantsStream(req);
  let stopHeartbeat = () => {};
  if (stream) {
    openSse(res, setCookie);
    stopHeartbeat = startHeartbeat(res);
    if (request.references.length > 0) writeSse(res, "status", { stage: "reading-reference" });
  }
  const references =
    request.references.length === 0
      ? []
      : await fetchReferences(request.references, {
          resolve: ctx.resolve,
          transport: ctx.transport,
          timeoutMs: config.limits.referenceTimeoutMs,
          maxBytes: config.limits.referenceMaxBytes,
          maxChars: HARD.maxReferenceChars,
        });
  let budgetLeft = HARD.maxReferencesTotalChars;
  for (const item of references) {
    if (!item.ok) continue;
    item.text = item.text.slice(0, Math.max(0, budgetLeft));
    budgetLeft -= item.text.length;
  }

  if (stream) writeSse(res, "status", { stage: "picking-palette" });
  const outcome = await generate({ config, fetchImpl: ctx.fetchImpl, now, client, deadline: deadline + 1, onDelta: stream ? deltaWriter(res) : undefined }, request, references).then(
    (value) => ({ ...value, crashed: false }),
    () => ({ crashed: true, spent: amountMicro, called: 1, result: { ok: false, kind: "network" } }),
  );
  // Whatever happened, the reservation is settled: to the reported usage, or whole when the call may have run.
  await ledger.settle(admitted.id, outcome.called === 0 ? 0 : outcome.spent).catch(() => {
    // The reservation stays open and is charged in full when its time is up: never lost, never refunded.
    log({ outcome: "settle-failed", costMicro: outcome.spent });
  });

  const base = { ms: now() - started, refs: references.length, costMicro: outcome.spent, calls: outcome.called };
  if (stream) {
    stopHeartbeat();
    return finishStream(res, { outcome, request, references, release, log, base });
  }
  if (!outcome.result.ok) {
    // The provider's HTTP status is not a secret and is the first thing an operator needs.
    log({ outcome: `upstream-${outcome.result.kind}`, ...base, ...(outcome.result.status ? { status: outcome.result.status, detail: outcome.result.detail } : {}) });
    if (outcome.result.kind === "aborted") return;
    return send(res, outcome.result.kind === "timeout" ? 504 : 502, { error: outcome.result.kind === "timeout" ? "timeout" : "upstream", references: referenceReport(references) }, setCookie);
  }
  const answer = await interpret(outcome.result.content, request.current);
  if (!answer.ok) {
    log({ outcome: "invalid-output", ...base });
    return send(res, 502, { error: "invalid-output", references: referenceReport(references) }, setCookie);
  }
  log({ outcome: "ok", ...base, changed: changedPaths(request.current, answer.tokens).length });
  return send(
    res,
    200,
    { requestId: request.requestId, summary: answer.summary, tokens: answer.tokens, changed: changedPaths(request.current, answer.tokens), references: referenceReport(references), release: release.id },
    setCookie,
  );
}

/** Free, and safe to call from a page at any time: it never reaches the provider. */
function statusPayload(config, ledger) {
  const reason = unavailableReason(config, ledger);
  return {
    available: reason === null,
    ...(reason ? { reason } : {}),
    limits: {
      maxPromptChars: HARD.maxPromptChars,
      maxReferences: HARD.maxReferences,
      maxHistoryTurns: HARD.maxHistoryTurns,
    },
  };
}

async function route(ctx, req, res) {
  const url = new URL(req.url ?? "/", "http://suggest.local");
  if (url.pathname === `${PATH}/version`) {
    if (req.method !== "GET" && req.method !== "HEAD") return refuse(res, 405, "method");
    return send(res, 200, ctx.release);
  }
  if (url.pathname === `${PATH}/status`) {
    if (req.method !== "GET" && req.method !== "HEAD") return refuse(res, 405, "method");
    return send(res, 200, statusPayload(ctx.config, ctx.ledger));
  }
  if (url.pathname !== PATH && url.pathname !== `${PATH}/`) return refuse(res, 404, "not-found");
  if (req.method !== "POST") return refuse(res, 405, "method");
  return suggest(ctx, req, res);
}

function versionPayload(config, id) {
  return {
    id,
    model: config.primary ? config.primary.model : "",
    maxTokens: config.limits.maxOutputTokens,
    effort: config.primary ? config.primary.effort : "",
    generation: config.problems.length === 0 ? "enabled" : "disabled",
  };
}

export function listenSuggest(options = {}) {
  const env = options.env ?? process.env;
  const config = loadConfig(env);
  const now = options.now ?? (() => Date.now());
  const opening = options.ledger ? Promise.resolve({ ledger: options.ledger }) : openLedgerSafely({ dir: config.stateDir, now });
  return opening.then(({ ledger = null, error }) => {
    const log = options.log ?? ((event) => console.log(JSON.stringify({ at: new Date(now()).toISOString(), event: "suggest", ...event })));
    if (error) log({ outcome: "ledger-unavailable", error });
    const ctx = {
      config,
      ledger,
      now,
      log,
      fetchImpl: options.fetchImpl ?? globalThis.fetch,
      trusted: trustedList(config.network.trustedProxies),
      burst: burstLimiter(options.burstPerMinute ?? Math.max(6, config.limits.ipPerMinute * 2), now),
      sessionSecret: config.network.sessionSecret || randomBytes(32).toString("hex"),
      release: versionPayload(config, releaseId(env)),
      ...(options.resolve ? { resolve: options.resolve } : {}),
      ...(options.transport ? { transport: options.transport } : {}),
    };
    const server = createServer((req, res) => {
      route(ctx, req, res).catch(() => {
        if (!res.headersSent) refuse(res, 500, "internal");
      });
    });
    // A request is at most a few kilobytes: whoever has not sent it within seconds is holding a socket, not asking.
    // (Node's defaults are 60 s for headers and 300 s for the whole request, with no cap on connections.)
    const requestWindowMs = config.limits.timeoutMs + config.limits.referenceTimeoutMs + 5_000;
    server.headersTimeout = requestWindowMs;
    server.requestTimeout = requestWindowMs;
    server.keepAliveTimeout = 5_000;
    server.maxConnections = 256;
    return new Promise((done, fail) => {
      server.once("error", fail);
      server.listen(options.port ?? 0, options.host ?? "127.0.0.1", () => {
        const address = server.address();
        done({ server, port: address.port, ledger, config });
      });
    });
  });
}

// A short fingerprint: comparable with a known value, unreadable in a log that masks secrets anyway.
const fp = (value) => createHash("sha256").update(String(value)).digest("hex").slice(0, 8);

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1]);
if (invoked) {
  listenSuggest({ host: "0.0.0.0", port: Number(process.env.PORT || 3001) }).then(({ port, config }) => {
    console.log(`suggest: listening on ${port}; generation ${config.problems.length === 0 ? "on" : `off (${config.problems.join("; ")})`}`);
    // Where calls go, never the key: a 404 from the provider is a wrong URL or model, and this is how to see which.
    for (const p of providersOf(config))
      fetch(`${p.base.endsWith("/v1") ? p.base : `${p.base}/v1`}/models`, { headers: { authorization: `Bearer ${p.key}` }, signal: AbortSignal.timeout(10_000) })
        .then((r) => r.json().then((j) => console.log(`suggest: models ${r.status} ${JSON.stringify((j.data ?? []).map((m) => m.id))}`)))
        .catch((e) => console.log(`suggest: models check failed ${e?.name}`));
    for (const p of providersOf(config)) console.log(`suggest: provider base#${fp(p.base)} model#${fp(p.model)} effort#${fp(p.effort)} key#${fp(p.key)} lengths ${p.base.length}/${p.model.length}/${p.effort.length}/${p.key.length}`);
  });
}

