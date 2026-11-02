// The resource envelope of the identity suggest service, read once from the environment.
//
// Two layers. HARD is the ceiling compiled into the code: no environment value can raise a limit past it, so a
// typo cannot turn a small service into an open tap (OWASP API4:2023, unrestricted resource consumption).
// Everything else comes from the environment, and paid generation stays off until every value it needs is set:
// there is no default budget and no default price, because an unlimited default is the failure to avoid.

/** Ceilings no configuration can exceed. */
export const HARD = Object.freeze({
  maxBodyBytes: 16_384,
  maxPromptChars: 1_000,
  maxHistoryTurns: 6,
  maxTurnChars: 500,
  maxReferences: 3,
  maxReferenceChars: 1_500,
  maxReferencesTotalChars: 4_000,
  /** `max_tokens` covers reasoning plus the JSON answer. */
  maxOutputTokens: 8_000,
  maxTimeoutMs: 60_000,
  maxConcurrent: 8,
  /** The most provider calls one request can make: the primary, then the fallback once. No retry loops. */
  maxProviderCalls: 2,
});

const DEFAULTS = Object.freeze({
  maxOutputTokens: 4_000,
  timeoutMs: 45_000,
  maxConcurrent: 2,
  ipPerMinute: 3,
  ipPerDay: 20,
  sessionPerDay: 12,
  globalPerDay: 300,
  referenceTimeoutMs: 8_000,
  referenceMaxBytes: 524_288,
});

function integer(raw, { fallback, min, max }) {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Dollars as integer micro-dollars; null when absent or not a positive number. */
function microUsd(raw) {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1_000_000);
}

/** Empty or "minimal" leaves the model's own default. */
function reasoningEffort(raw) {
  const effort = String(raw ?? "").trim();
  return effort === "minimal" ? "" : effort;
}

function provider(env, prefix) {
  const base = env[`${prefix}BASE_URL`];
  const key = env[`${prefix}API_KEY`];
  const model = env[`${prefix}MODEL`];
  if (!base || !key || !model) return null;
  const input = microUsd(env[`${prefix}PRICE_INPUT_USD_PER_MTOK`]);
  const output = microUsd(env[`${prefix}PRICE_OUTPUT_USD_PER_MTOK`]);
  return {
    base: String(base).replace(/\/$/, ""),
    key: String(key),
    model: String(model),
    effort: reasoningEffort(env[`${prefix}REASONING_EFFORT`]),
    /** Micro-dollars per million tokens. Null until the price is configured: no price, no spend. */
    priceInput: input,
    priceOutput: output,
  };
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns the config, plus `problems`: why paid generation is off (empty when it can run).
 */
export function loadConfig(env) {
  const primary = provider(env, "IDENTITY_AI_");
  const fallback = provider(env, "IDENTITY_AI_FALLBACK_");
  const dailyMicro = microUsd(env.IDENTITY_AI_BUDGET_DAILY_USD);
  const monthlyMicro = microUsd(env.IDENTITY_AI_BUDGET_MONTHLY_USD);

  const problems = [];
  if (env.IDENTITY_AI_ENABLED !== "1") problems.push("IDENTITY_AI_ENABLED is not 1");
  if (!primary) problems.push("no provider: IDENTITY_AI_BASE_URL, _API_KEY and _MODEL are all required");
  if (primary && (primary.priceInput === null || primary.priceOutput === null)) {
    problems.push("IDENTITY_AI_PRICE_INPUT_USD_PER_MTOK and IDENTITY_AI_PRICE_OUTPUT_USD_PER_MTOK are required");
  }
  if (dailyMicro === null) problems.push("IDENTITY_AI_BUDGET_DAILY_USD is required (an approved daily ceiling, in dollars)");

  // A fallback that cannot be priced would be spend nobody accounts for: it is switched off instead.
  const usableFallback = fallback && fallback.priceInput !== null && fallback.priceOutput !== null ? fallback : null;

  return {
    problems,
    primary,
    fallback: usableFallback,
    budget: { dailyMicro, monthlyMicro },
    limits: {
      maxOutputTokens: integer(env.IDENTITY_AI_MAX_TOKENS, { fallback: DEFAULTS.maxOutputTokens, min: 256, max: HARD.maxOutputTokens }),
      timeoutMs: integer(env.IDENTITY_AI_TIMEOUT_MS, { fallback: DEFAULTS.timeoutMs, min: 1_000, max: HARD.maxTimeoutMs }),
      maxConcurrent: integer(env.IDENTITY_AI_MAX_CONCURRENT, { fallback: DEFAULTS.maxConcurrent, min: 1, max: HARD.maxConcurrent }),
      ipPerMinute: integer(env.IDENTITY_AI_IP_PER_MINUTE, { fallback: DEFAULTS.ipPerMinute, min: 1, max: 60 }),
      ipPerDay: integer(env.IDENTITY_AI_IP_PER_DAY, { fallback: DEFAULTS.ipPerDay, min: 1, max: 500 }),
      sessionPerDay: integer(env.IDENTITY_AI_SESSION_PER_DAY, { fallback: DEFAULTS.sessionPerDay, min: 1, max: 500 }),
      globalPerDay: integer(env.IDENTITY_AI_GLOBAL_PER_DAY, { fallback: DEFAULTS.globalPerDay, min: 1, max: 10_000 }),
      referenceTimeoutMs: integer(env.IDENTITY_AI_REFERENCE_TIMEOUT_MS, { fallback: DEFAULTS.referenceTimeoutMs, min: 1_000, max: 15_000 }),
      referenceMaxBytes: DEFAULTS.referenceMaxBytes,
    },
    network: {
      trustedProxies: String(env.IDENTITY_AI_TRUSTED_PROXIES ?? "").trim(),
      sessionSecret: String(env.IDENTITY_AI_SESSION_SECRET ?? "").trim(),
    },
    stateDir: String(env.IDENTITY_AI_STATE_DIR ?? "/data").trim() || "/data",
  };
}

/** The most one provider call can cost, in micro-dollars: every input token, plus a full output allowance. */
export function worstCaseMicro(provider, inputTokens, outputTokens) {
  const input = Math.ceil((inputTokens * provider.priceInput) / 1_000_000);
  const output = Math.ceil((outputTokens * provider.priceOutput) / 1_000_000);
  return input + output;
}

/**
 * The actual cost from the provider's own usage report. Without a usable report the reservation stands (the
 * worst case). With one, the truth is recorded even if it is above the reservation: accounting does not flatter.
 */
export function actualMicro(provider, usage, reservedMicro) {
  const input = Number(usage?.prompt_tokens);
  const output = Number(usage?.completion_tokens);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) return reservedMicro;
  return worstCaseMicro(provider, input, output);
}
