/** What one request to the assistant may hold. Mirrors the service's own ceilings (`deploy/suggest/config.mjs`). Imports nothing, so the home page can use it for free. */
export const LIMITS = { prompt: 1_000, history: 6, turn: 500, references: 3 } as const;
