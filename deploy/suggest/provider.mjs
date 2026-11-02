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

/**
 * @returns {Promise<
 *   | { ok: true, content: string, usage: object | undefined }
 *   | { ok: false, kind: "http" | "timeout" | "aborted" | "network" | "shape", status?: number, billable: boolean }
 * >}
 * `billable` says whether the provider may have charged for the call: a refusal (an HTTP error) or a refused
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
      if (!res.ok) return { ok: false, kind: "http", status: res.status, billable: false };
      return parseJson(text).then((outer) => {
        const content = outer.ok ? contentText(outer.value?.choices?.[0]?.message?.content) : "";
        if (!content) return { ok: false, kind: "shape", billable: true };
        return { ok: true, content, usage: outer.value?.usage };
      });
    })
    .catch((error) => {
      if (error?.name === "TimeoutError") return { ok: false, kind: "timeout", billable: true };
      if (error?.name === "AbortError") return { ok: false, kind: "aborted", billable: true };
      // Only failures that happen before a request can have been sent are free; a reset mid-flight may not be.
      return { ok: false, kind: "network", billable: !NEVER_SENT.has(error?.cause?.code) };
    });
}
