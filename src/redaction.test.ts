import { describe, expect, it } from 'vitest';

import { redactArgs } from './redaction.js';

describe('redactArgs', () => {
  it('redacts password key', () => {
    const r = redactArgs({ user: 'elliot', password: 'secret' }) as Record<string, unknown>;
    expect(r.user).toBe('elliot');
    expect(r.password).toBe('[REDACTED]');
    expect(typeof r.password_hash).toBe('string');
  });

  it('redacts token key', () => {
    const r = redactArgs({ token: 'abc' }) as Record<string, unknown>;
    expect(r.token).toBe('[REDACTED]');
  });

  it('redacts api_key and api-key spellings', () => {
    const r1 = redactArgs({ api_key: 'a' }) as Record<string, unknown>;
    const r2 = redactArgs({ 'api-key': 'b' }) as Record<string, unknown>;
    expect(r1.api_key).toBe('[REDACTED]');
    expect(r2['api-key']).toBe('[REDACTED]');
  });

  it('redacts case-insensitively', () => {
    const r = redactArgs({ Authorization: 'Bearer abc' }) as Record<string, unknown>;
    expect(r.Authorization).toBe('[REDACTED]');
  });

  it('walks nested objects', () => {
    const r = redactArgs({
      outer: { inner: { secret: 'x' } },
    }) as Record<string, unknown>;
    const inner = (r.outer as Record<string, unknown>).inner as Record<string, unknown>;
    expect(inner.secret).toBe('[REDACTED]');
  });

  it('walks arrays', () => {
    const r = redactArgs([{ password: 'a' }, { password: 'b' }]) as Array<
      Record<string, unknown>
    >;
    expect(r[0]?.password).toBe('[REDACTED]');
    expect(r[1]?.password).toBe('[REDACTED]');
  });

  it('redacts JWT-shaped strings even with innocuous keys', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const r = redactArgs({ value: jwt }) as Record<string, unknown>;
    expect(r.value).toBe('[REDACTED]');
  });

  it('redacts FlowDot MCP token shape', () => {
    const r = redactArgs({ value: 'fd_mcp_aaaaaaaaaaaaaaaa_extra' }) as Record<string, unknown>;
    expect(r.value).toBe('[REDACTED]');
  });

  it('redacts OpenAI-style sk- tokens', () => {
    const r = redactArgs({ value: 'sk-abcdef0123456789' }) as Record<string, unknown>;
    expect(r.value).toBe('[REDACTED]');
  });

  it('redacts GitHub PAT family', () => {
    const r = redactArgs({
      value: 'ghp_' + 'a'.repeat(36),
    }) as Record<string, unknown>;
    expect(r.value).toBe('[REDACTED]');
  });

  it('redacts Slack token family', () => {
    const r = redactArgs({
      value: 'xoxb-' + 'a'.repeat(40),
    }) as Record<string, unknown>;
    expect(r.value).toBe('[REDACTED]');
  });

  it('passes through innocuous primitives', () => {
    expect(redactArgs(42)).toBe(42);
    expect(redactArgs(true)).toBe(true);
    expect(redactArgs('hello world')).toBe('hello world');
    expect(redactArgs(null)).toBeNull();
    expect(redactArgs(undefined)).toBeUndefined();
  });

  it('does not add _hash for empty-string sensitive values', () => {
    const r = redactArgs({ password: '' }) as Record<string, unknown>;
    expect(r.password).toBe('[REDACTED]');
    expect(r.password_hash).toBeUndefined();
  });

  it('caps recursion depth defensively', () => {
    // Build a 70-deep nested object.
    const obj: Record<string, unknown> = {};
    let cursor: Record<string, unknown> = obj;
    for (let i = 0; i < 70; i++) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    cursor.password = 'x';
    // Just ensure no stack overflow + we get something back.
    const out = redactArgs(obj);
    expect(out).toBeDefined();
  });
});
