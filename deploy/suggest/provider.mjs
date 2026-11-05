// One call to an OpenAI-compatible chat-completions origin (the contract the Muse route and the fallback both speak).
//
// No retries here and no repair: the caller decides whether a second origin is tried, once. Every outcome is data:
// a reply with its usage, or a kind of failure the caller can account for. Nothing throws.

const NEVER_SENT = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ENETUNREACH", "ERR_INVALID_URL"]);

function chatUrl(base) {
  return base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
}

function unwrap(content) {
  const trimmed = content.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1] : trimmed;
}

function contentText(content) {
  if (typeof content === "string") return unwrap(content);
  if (!Array.isArray(content)) return "";
  return unwrap(content.map((part) => (typeof part === "string" ? part : typeof part?.text === "string" ? part.text : "")).join(""));
}

/** A JSON text to a value, without throwing. */
export function parseJson(text) {
  return Promise.resolve(text)
    .then((raw) => JSON.parse(raw))
    .then((value) => ({ ok: true, value }))
    .catch(() => ({ ok: false, value: null }));
}

function contentTypeOf(res) {
  const headers = res.headers;
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get("content-type") ?? "";
  return headers["content-type"] ?? "";
}

function finishContent(content, usage) {
  const text = unwrap(content);
  if (!text) return { ok: false, kind: "shape", billable: true };
  return { ok: true, content: text, usage };
}

function interpretJsonReply(text, onDelta) {
  return parseJson(text).then((outer) => {
    const content = outer.ok ? contentText(outer.value?.choices?.[0]?.message?.content) : "";
    if (!content) return { ok: false, kind: "shape", billable: true };
    onDelta?.(content);
    return { ok: true, content, usage: outer.value?.usage };
  });
}

async function readOpenAiPart(part) {
  let delta = "";
  let usage;
  let done = false;
  for (const raw of part.split("\n")) {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") {
      done = true;
      continue;
    }
    const parsed = await parseJson(data);
    if (!parsed.ok) continue;
    const piece = parsed.value?.choices?.[0]?.delta?.content;
    if (typeof piece === "string") delta += piece;
    if (parsed.value?.usage) usage = parsed.value.usage;
  }
  return { delta, usage, done };
}

async function consumeOpenAiSse(res, onDelta) {
  if (!res.body || typeof res.body[Symbol.asyncIterator] !== "function") {
    return interpretJsonReply(await res.text(), onDelta);
  }
  const decoder = new globalThis.TextDecoder();
  let buffer = "";
  let content = "";
  let usage;
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const applied = await readOpenAiPart(part);
      if (applied.delta) {
        content += applied.delta;
        onDelta?.(applied.delta);
      }
      if (applied.usage) usage = applied.usage;
      if (applied.done) return finishContent(content, usage);
    }
  }
  if (buffer.trim()) {
    const applied = await readOpenAiPart(buffer);
    if (applied.delta) {
      content += applied.delta;
      onDelta?.(applied.delta);
    }
    if (applied.usage) usage = applied.usage;
  }
  return finishContent(content, usage);
}

function failHttp(res, text) {
  return { ok: false, kind: "http", status: res.status, detail: text.slice(0, 200), billable: res.status >= 500 || res.status === 408 };
}

function failCaught(error) {
  if (error?.name === "TimeoutError") return { ok: false, kind: "timeout", billable: true };
  if (error?.name === "AbortError") return { ok: false, kind: "aborted", billable: true };
  return { ok: false, kind: "network", billable: !NEVER_SENT.has(error?.cause?.code) };
}

/**
 * @returns {Promise<
 *   | { ok: true, content: string, usage: object | undefined }
 *   | { ok: false, kind: "http" | "timeout" | "aborted" | "network" | "shape", status?: number, billable: boolean }
 * >}
 * `billable` says whether the provider may have charged for the call: a refusal (a 4xx) or a refused
 * connection did no work; a timeout, a cut connection or a malformed answer may have.
 */
export function callProvider(provider, { messages, maxTokens, signal, fetchImpl, effort }) {
  return fetchImpl(chatUrl(provider.base), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: maxTokens,
      ...(effort ? { reasoning_effort: effort } : {}),
      messages,
    }),
    signal,
  })
    .then((res) => res.text().then((text) => ({ res, text })))
    .then(({ res, text }) => {
      // A gateway can time out after the work was done: a server error (5xx) or a 408 may have been charged. A
      // refusal (4xx, 429) did no work.
      if (!res.ok) return failHttp(res, text);
      return parseJson(text).then((outer) => {
        const content = outer.ok ? contentText(outer.value?.choices?.[0]?.message?.content) : "";
        if (!content) return { ok: false, kind: "shape", billable: true };
        return { ok: true, content, usage: outer.value?.usage };
      });
    })
    .catch(failCaught);
}

/** Same contract as `callProvider`, with token deltas as they arrive (or one delta if the origin answers JSON). */
function streamRejected(res, text) {
  return res.status === 400 && /stream/i.test(text);
}

function asStreamed(result, onDelta) {
  if (result.ok) onDelta?.(result.content);
  return result;
}

export function callProviderStream(provider, { messages, maxTokens, signal, fetchImpl, effort, onDelta }) {
  const args = { messages, maxTokens, signal, fetchImpl, effort };
  return fetchImpl(chatUrl(provider.base), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
      ...(effort ? { reasoning_effort: effort } : {}),
      messages,
    }),
    signal,
  })
    .then((res) => {
      if (!res.ok) {
        return res.text().then((text) => (streamRejected(res, text)
          ? callProvider(provider, args).then((result) => asStreamed(result, onDelta))
          : failHttp(res, text)));
      }
      const type = contentTypeOf(res);
      if (type.includes("text/event-stream")) return consumeOpenAiSse(res, onDelta);
      return res.text().then((text) => interpretJsonReply(text, onDelta));
    })
    .catch(failCaught);
}
