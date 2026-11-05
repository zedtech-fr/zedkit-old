/** SSE helpers for the identity suggest server. Separate from JSON `send`. */

const HEARTBEAT_MS = 15_000;

const STAGES = {
  palette: "picking-palette",
  typography: "picking-typography",
  spacing: "picking-spacing",
};

export function wantsStream(req) {
  const accept = req.headers.accept ?? req.headers.Accept ?? "";
  return typeof accept === "string" && accept.includes("text/event-stream");
}

export function writeSse(res, event, data) {
  if (res.writableEnded) return false;
  const payload = data === undefined ? "" : `data: ${JSON.stringify(data)}\n`;
  res.write(event ? `event: ${event}\n${payload}\n` : `:${payload ? ` ${payload}` : ""}\n`);
  return true;
}

export function openSse(res, headers = {}) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
    ...headers,
  });
  // Immediate first byte so a proxy idle timeout cannot fire before work starts.
  res.write(":\n\n");
}

export function startHeartbeat(res, ms = HEARTBEAT_MS) {
  const timer = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(timer);
      return;
    }
    res.write(": keepalive\n\n");
  }, ms);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}

function readJsonString(chunk, key, from) {
  const needle = `"${key}"`;
  const at = chunk.indexOf(needle, from);
  if (at < 0) return { value: "", next: from };
  let i = chunk.indexOf(":", at + needle.length);
  if (i < 0) return { value: "", next: from };
  while (chunk[i + 1] === " ") i += 1;
  if (chunk[i + 1] !== '"') return { value: "", next: from };
  let out = "";
  for (let j = i + 2; j < chunk.length; j += 1) {
    const ch = chunk[j];
    if (ch === "\\") {
      if (j + 1 >= chunk.length) return { value: out, next: at };
      const next = chunk[j + 1];
      out += next === "n" ? "\n" : next;
      j += 1;
      continue;
    }
    if (ch === '"') return { value: out, next: j + 1 };
    out += ch;
  }
  return { value: out, next: at };
}

/** Best-effort `"summary"` value from incremental JSON, without JSON.parse. */
export function extractJsonString(chunk, key = "summary") {
  return readJsonString(chunk, key, 0).value;
}

export function inferStage(chunk) {
  if (chunk.includes('"spacing"') || chunk.includes('"radius"') || chunk.includes('"borderWidth"')) {
    return STAGES.spacing;
  }
  if (chunk.includes('"fontSans"') || chunk.includes('"fontDisplay"')) return STAGES.typography;
  if (chunk.includes('"light"') || chunk.includes('"dark"') || chunk.includes('"accent"')) return STAGES.palette;
  return STAGES.palette;
}

export function applyDelta(state, delta) {
  const raw = state.raw + delta;
  const summary = extractJsonString(raw);
  const emitted = state.emitted;
  const next = summary.length >= emitted.length && summary.startsWith(emitted) ? summary : emitted;
  const added = next.slice(emitted.length);
  return {
    raw,
    emitted: next,
    added,
    stage: inferStage(raw),
  };
}
