import type { IdentityTokens } from "@zedtech/zedkit-ui";

import { LIMITS } from "./identity-assistant-limits.ts";

/**
 * The page's side of the identity suggest service (`deploy/suggest`). One function sends a brief and gets back one
 * of a fixed set of outcomes; nothing here throws, and nothing partial ever leaves it: an answer is either a whole
 * identity the shared schema accepts or a named failure. Words for each outcome live in the page's copy.
 */

export const ASSISTANT_URL = "/api/identity/suggest";
export { LIMITS };

export type ReferenceReport = {
  url: string;
  status: "used" | "failed";
  /** What was read: the page's CSS and text ("styles-and-text"), or its text alone. Never a rendered look. */
  analysis?: "styles-and-text" | "text-only";
  reason?: string;
  host?: string;
  title?: string;
  chars?: number;
  hints?: { themeColor?: string; fonts?: string[]; colors?: string[]; radius?: string };
};

/** Short plain strings from an untrusted report, or nothing. */
const shortStrings = (value: unknown, count: number, chars: number): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, count).map((item) => item.slice(0, chars)) : [];

function hintsOf(value: unknown): { hints?: NonNullable<ReferenceReport["hints"]> } {
  if (!value || typeof value !== "object") return {};
  const hints = value as Record<string, unknown>;
  const out: NonNullable<ReferenceReport["hints"]> = {
    ...(typeof hints.themeColor === "string" && hints.themeColor ? { themeColor: hints.themeColor.slice(0, 30) } : {}),
    fonts: shortStrings(hints.fonts, 6, 40),
    colors: shortStrings(hints.colors, 5, 32),
    ...(typeof hints.radius === "string" && hints.radius ? { radius: hints.radius.slice(0, 24) } : {}),
  };
  return { hints: out };
}

export type Turn = { role: "user" | "assistant"; text: string };

export type AssistantInput = {
  requestId: string;
  prompt: string;
  history: readonly Turn[];
  references: readonly string[];
  current: IdentityTokens;
};

export type Unavailable = "disabled" | "not-configured" | "unavailable" | "killed" | "unreachable";

export type AssistantResult =
  | { kind: "ok"; requestId: string; tokens: IdentityTokens; summary: string; changed: string[]; references: ReferenceReport[] }
  | { kind: "unavailable"; reason: Unavailable }
  | { kind: "quota" | "rate" | "busy"; retryAfterSec?: number }
  | { kind: "duplicate" | "too-large" | "network" | "aborted" }
  | { kind: "invalid-input"; field: string }
  | { kind: "invalid-output" | "upstream" | "timeout"; references: ReferenceReport[] };

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const UNAVAILABLE = new Set<string>(["disabled", "not-configured", "unavailable", "killed"]);

export { newRequestId } from "./identity-request-id.ts";

/** The limits the service enforces, checked here too so a visitor is told before anything is sent. */
export function checkInput(input: Pick<AssistantInput, "prompt" | "references">): "ok" | "empty" | "too-long" | "too-many-references" {
  const prompt = input.prompt.trim();
  if (prompt === "") return "empty";
  if (prompt.length > LIMITS.prompt) return "too-long";
  if (input.references.length > LIMITS.references) return "too-many-references";
  return "ok";
}

/** The last turns the service accepts, each cut to its limit. */
export function trimHistory(turns: readonly Turn[]): Turn[] {
  return turns.slice(-LIMITS.history).map((turn) => ({ role: turn.role, text: turn.text.trim().slice(0, LIMITS.turn) }));
}

function referencesOf(value: unknown): ReferenceReport[] {
  if (!Array.isArray(value)) return [];
  const out: ReferenceReport[] = [];
  // The service reports at most the links it was sent. A longer or wider report is not believed.
  for (const row of value.slice(0, LIMITS.references)) {
    if (!row || typeof row !== "object") continue;
    const ref = row as Record<string, unknown>;
    if (typeof ref.url !== "string" || (ref.status !== "used" && ref.status !== "failed")) continue;
    out.push({
      url: ref.url.slice(0, 200),
      status: ref.status,
      ...(ref.status === "used" ? { analysis: ref.analysis === "styles-and-text" ? ("styles-and-text" as const) : ("text-only" as const) } : {}),
      ...(ref.status === "used" ? hintsOf(ref.hints) : {}),
      ...(typeof ref.reason === "string" ? { reason: ref.reason.slice(0, 40) } : {}),
      ...(typeof ref.host === "string" ? { host: ref.host.slice(0, 80) } : {}),
      ...(typeof ref.title === "string" && ref.title ? { title: ref.title.slice(0, 80) } : {}),
      ...(typeof ref.chars === "number" ? { chars: ref.chars } : {}),
    });
  }
  return out;
}

/** A monthly budget can sit ~31 days out; anything larger is not a clock we will show. */
const MAX_RETRY_AFTER_SEC = 40 * 86_400;

function retryAfter(res: Response, body: Record<string, unknown>): number | undefined {
  const fromBody = typeof body.retryAfterSec === "number" ? body.retryAfterSec : Number(res.headers.get("retry-after"));
  return Number.isFinite(fromBody) && fromBody > 0 ? Math.min(Math.ceil(fromBody), MAX_RETRY_AFTER_SEC) : undefined;
}

export function readJson(res: Response): Promise<Record<string, unknown>> {
  return res
    .text()
    .then((text) => JSON.parse(text) as unknown)
    .then((value) => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}))
    .catch(() => ({}));
}

function failure(res: Response, body: Record<string, unknown>): AssistantResult {
  const error = typeof body.error === "string" ? body.error : "";
  const references = referencesOf(body.references);
  if (res.status === 503) {
    const reason = typeof body.reason === "string" && UNAVAILABLE.has(body.reason) ? (body.reason as Unavailable) : "unavailable";
    return { kind: "unavailable", reason };
  }
  if (res.status === 429) {
    const kind = error === "quota" ? "quota" : error === "busy" ? "busy" : "rate";
    const after = retryAfter(res, body);
    return after === undefined ? { kind } : { kind, retryAfterSec: after };
  }
  if (res.status === 409) return { kind: "duplicate" };
  if (res.status === 413) return { kind: "too-large" };
  if (res.status === 400) return { kind: "invalid-input", field: typeof body.field === "string" ? body.field : "body" };
  if (res.status === 504) return { kind: "timeout", references };
  if (res.status === 502) return { kind: error === "invalid-output" ? "invalid-output" : "upstream", references };
  return { kind: "network" };
}

export function resultFromStreamError(payload: Record<string, unknown>): AssistantResult {
  const error = typeof payload.error === "string" ? payload.error : "upstream";
  const references = referencesOf(payload.references);
  if (error === "timeout") return { kind: "timeout", references };
  if (error === "invalid-output") return { kind: "invalid-output", references };
  return { kind: "upstream", references };
}

export function resultFromBody(res: Response, body: Record<string, unknown>, requestId: string): Promise<AssistantResult> {
  if (res.status !== 200) return Promise.resolve(failure(res, body));
  const references = referencesOf(body.references);
  return import("./identity-tokens-parse.ts").then(({ parseIdentityTokens }) => {
    const parsed = parseIdentityTokens(body.tokens);
    if (!parsed.success) return { kind: "invalid-output" as const, references };
    return {
      kind: "ok" as const,
      requestId: typeof body.requestId === "string" ? body.requestId : requestId,
      tokens: parsed.data,
      summary: typeof body.summary === "string" ? body.summary.trim().slice(0, 600) : "",
      changed: Array.isArray(body.changed) ? body.changed.filter((path): path is string => typeof path === "string").slice(0, 40) : [],
      references,
    };
  });
}

/**
 * Sends one brief. The identity in an `ok` answer has passed `parseIdentityTokens`, the same schema the service
 * and the saved library use; an answer that does not is `invalid-output`, whatever else it says.
 */
export function requestIdentity(input: AssistantInput, { fetchImpl = globalThis.fetch.bind(globalThis), signal }: { fetchImpl?: FetchLike | undefined; signal?: AbortSignal | undefined } = {}): Promise<AssistantResult> {
  const checked = checkInput(input);
  if (checked !== "ok") return Promise.resolve({ kind: "invalid-input", field: checked === "too-many-references" ? "references" : "prompt" });
  return fetchImpl(ASSISTANT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    ...(signal ? { signal } : {}),
    body: JSON.stringify({
      requestId: input.requestId,
      prompt: input.prompt.trim(),
      history: trimHistory(input.history),
      references: input.references,
      current: input.current,
    }),
  })
    .then((res) => readJson(res).then((body) => resultFromBody(res, body, input.requestId)))
    .catch((error: unknown) => ((error as { name?: string } | null)?.name === "AbortError" ? { kind: "aborted" } : { kind: "network" }));
}

export type AssistantStatus = { available: true } | { available: false; reason: Unavailable };

/** Free: asks whether generation is on. Never starts any paid work, so a page may call it at any time. */
export function fetchAssistantStatus({ fetchImpl = globalThis.fetch.bind(globalThis), signal }: { fetchImpl?: FetchLike | undefined; signal?: AbortSignal | undefined } = {}): Promise<AssistantStatus> {
  return fetchImpl(`${ASSISTANT_URL}/status`, { ...(signal ? { signal } : {}), headers: { accept: "application/json" } })
    .then((res) => (res.ok ? readJson(res) : Promise.resolve<Record<string, unknown> | null>(null)))
    .then((body): AssistantStatus => {
      if (!body) return { available: false, reason: "unreachable" };
      if (body.available === true) return { available: true };
      const reason = typeof body.reason === "string" && UNAVAILABLE.has(body.reason) ? (body.reason as Unavailable) : "unavailable";
      return { available: false, reason };
    })
    .catch(() => ({ available: false, reason: "unreachable" }));
}
