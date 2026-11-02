// Original work by the same author.
/**
 * Fixed-window rate limiter, in-process. Correct for single-instance
 * deployments; multi-instance enforcement needs a shared store behind the
 * same allow() shape.
 */
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_KEYS = 10_000;

export interface MemoryRateLimiterOptions {
  /** Window length in milliseconds. Default 60 000 (the limit is per minute). */
  windowMs?: number | undefined;
  /** Clock in milliseconds, injectable for tests. Default `Date.now`. */
  now?: (() => number) | undefined;
  /**
   * Tracked-key count past which expired windows are swept (at most once
   * per window). Live windows are never evicted, so a key spray cannot
   * reset another client's budget. Default 10 000.
   */
  maxKeys?: number | undefined;
}

export class MemoryRateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();
  private readonly windowMs: number;
  private readonly maxKeys: number;
  private readonly clock: () => number;
  private lastGc = 0;

  /** Throws on a non-positive or non-finite `windowMs` / `maxKeys`. */
  constructor(options: MemoryRateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
    this.clock = options.now ?? Date.now;
    if (!(Number.isFinite(this.windowMs) && this.windowMs > 0)) {
      throw new Error(`MemoryRateLimiter: windowMs must be a positive number, got ${this.windowMs}`);
    }
    if (!(Number.isInteger(this.maxKeys) && this.maxKeys >= 1)) {
      throw new Error(`MemoryRateLimiter: maxKeys must be a positive integer, got ${this.maxKeys}`);
    }
  }

  allow(key: string, limitPerMinute: number): boolean {
    // Fail closed on misconfiguration: a non-positive limit denies.
    if (!(limitPerMinute >= 1)) return false;
    if (key.trim().length === 0) return false;
    const now = this.clock();
    const current = this.windows.get(key);
    if (!current || now - current.start >= this.windowMs) {
      this.maybeGc(now);
      this.windows.set(key, { start: now, count: 1 });
      return true;
    }
    if (current.count >= limitPerMinute) return false;
    current.count += 1;
    return true;
  }

  // Drops expired windows, but at most once per window: past the key
  // cap, every insert would otherwise pay a full-map scan.
  private maybeGc(now: number): void {
    if (this.windows.size <= this.maxKeys) return;
    if (now - this.lastGc < this.windowMs) return;
    this.lastGc = now;
    for (const [k, v] of this.windows) {
      if (now - v.start >= this.windowMs) this.windows.delete(k);
    }
  }
}
