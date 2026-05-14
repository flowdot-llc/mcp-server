import { describe, expect, it } from 'vitest';

import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter token bucket', () => {
  it('allows up to bucket capacity in a burst', () => {
    const now = 0;
    const rl = new RateLimiter({ maxCallsPerSecond: 5, now: () => now });
    for (let i = 0; i < 5; i++) {
      expect(rl.tryConsume()).toEqual({ allowed: true });
    }
    const denied = rl.tryConsume();
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('refills tokens over time', () => {
    let now = 0;
    const rl = new RateLimiter({ maxCallsPerSecond: 10, now: () => now });
    // Drain.
    for (let i = 0; i < 10; i++) rl.tryConsume();
    expect(rl.tryConsume().allowed).toBe(false);

    // 100ms later → 1 token refilled (10/sec).
    now = 100;
    expect(rl.tryConsume().allowed).toBe(true);
    expect(rl.tryConsume().allowed).toBe(false);
  });

  it('caps refill at bucket capacity', () => {
    let now = 0;
    const rl = new RateLimiter({ maxCallsPerSecond: 5, now: () => now });
    // Wait a long time — refill should NOT exceed capacity.
    now = 1_000_000;
    expect(rl.currentTokens()).toBeLessThanOrEqual(5);
  });

  it('honors custom bucket capacity', () => {
    const now = 0;
    const rl = new RateLimiter({
      maxCallsPerSecond: 1,
      bucketCapacity: 10,
      now: () => now,
    });
    // Initial bucket holds 10.
    for (let i = 0; i < 10; i++) {
      expect(rl.tryConsume().allowed).toBe(true);
    }
    expect(rl.tryConsume().allowed).toBe(false);
  });

  it('uses Date.now by default', () => {
    const rl = new RateLimiter({ maxCallsPerSecond: 1 });
    expect(rl.tryConsume().allowed).toBe(true);
  });

  it('retryAfterMs reflects time until next token', () => {
    const now = 0;
    const rl = new RateLimiter({ maxCallsPerSecond: 10, now: () => now });
    rl.tryConsume();
    // Bucket: 9 tokens. Make it empty.
    for (let i = 0; i < 9; i++) rl.tryConsume();
    const r = rl.tryConsume();
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      // 10 tokens/sec means 100ms for 1 token.
      expect(r.retryAfterMs).toBeLessThanOrEqual(100);
      expect(r.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('elapsed time of 0 still works', () => {
    const now = 1000;
    const rl = new RateLimiter({ maxCallsPerSecond: 5, now: () => now });
    // Without moving time, currentTokens() should match starting capacity.
    expect(rl.currentTokens()).toBe(5);
    // Calling consume immediately works.
    expect(rl.tryConsume().allowed).toBe(true);
  });
});
