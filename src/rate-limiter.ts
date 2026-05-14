/**
 * Simple token-bucket rate limiter for MCP tool dispatch.
 *
 * Default: 50 calls/second with bucket size 50 (allows short bursts but
 * caps sustained throughput). Configurable per-supervisor.
 *
 * `tryConsume()` returns `{ allowed: true }` on success or
 * `{ allowed: false, retryAfterMs }` when the bucket is empty. We never
 * sleep — at the call site we either reject or proceed.
 */

export interface RateLimiterOptions {
  /** Max sustained calls per second. Default 50. */
  maxCallsPerSecond?: number;
  /** Bucket capacity (max burst). Default = maxCallsPerSecond. */
  bucketCapacity?: number;
  /** Override for time source (testing). */
  now?: () => number;
}

export interface ConsumeAllowed {
  allowed: true;
}

export interface ConsumeDenied {
  allowed: false;
  retryAfterMs: number;
}

export type ConsumeResult = ConsumeAllowed | ConsumeDenied;

export class RateLimiter {
  private readonly refillRatePerMs: number;
  private readonly capacity: number;
  private readonly now: () => number;
  private tokens: number;
  private lastRefillMs: number;

  constructor(options: RateLimiterOptions = {}) {
    const rate = options.maxCallsPerSecond ?? 50;
    this.refillRatePerMs = rate / 1000;
    this.capacity = options.bucketCapacity ?? rate;
    this.now = options.now ?? Date.now;
    this.tokens = this.capacity;
    this.lastRefillMs = this.now();
  }

  /**
   * Try to consume one token. Returns `{ allowed: true }` if the call
   * should proceed, or `{ allowed: false, retryAfterMs }` otherwise.
   */
  tryConsume(): ConsumeResult {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return { allowed: true };
    }
    const tokensNeeded = 1 - this.tokens;
    const retryAfterMs = Math.ceil(tokensNeeded / this.refillRatePerMs);
    return { allowed: false, retryAfterMs };
  }

  /** Current token count (after refill). For tests and introspection. */
  currentTokens(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const now = this.now();
    const elapsedMs = now - this.lastRefillMs;
    if (elapsedMs <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedMs * this.refillRatePerMs);
    this.lastRefillMs = now;
  }
}
