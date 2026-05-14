/**
 * Pattern-based redaction for audit-log tool args. Pre-alpha v0.x — the
 * SPEC's schema-driven redaction (open question §8.x) is the durable
 * answer; this is the first cut.
 *
 * Rules:
 *   1. Any object key matching SENSITIVE_KEY_RE has its value replaced with
 *      "[REDACTED]" plus a `<key>_hash` companion (sha256 prefix) so the
 *      audit grep retains some shape.
 *   2. Top-level string values that look like tokens / secrets (JWT, OpenAI
 *      key, FlowDot MCP token, GitHub PAT) are replaced wholesale, even if
 *      the key name is innocuous.
 *   3. Arrays + nested objects are walked recursively.
 *   4. Primitives that don't match a token shape are passed through.
 *
 * The original args still flow to the dispatch function — we only redact
 * what we WRITE to the audit log.
 */

import { createHash } from 'node:crypto';

const SENSITIVE_KEY_RE =
  /password|token|secret|api[_-]?key|authorization|bearer|credential/i;

// Patterns for strings that look like secrets even when the key name is innocuous.
const TOKEN_LIKE_PATTERNS: RegExp[] = [
  /^eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/, // JWT (3 dot-separated b64url chunks, eyJ = base64 of "{"
  /^sk-[A-Za-z0-9_-]{16,}$/, // OpenAI / Anthropic style
  /^fd_mcp_[A-Za-z0-9_]{16,}$/, // FlowDot MCP token
  /^gh[pousr]_[A-Za-z0-9]{36,}$/, // GitHub PAT family
  /^xox[bps]-[A-Za-z0-9-]{20,}$/, // Slack token family
];

const REDACTED = '[REDACTED]';

export function redactArgs(value: unknown): unknown {
  return redact(value, 0);
}

function redact(value: unknown, depth: number): unknown {
  // Defense against pathological deep recursion. 64 is well past any real
  // tool arg shape.
  if (depth > 64) return REDACTED;

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return looksLikeToken(value) ? REDACTED : value;
  }

  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((v) => redact(v, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      out[key] = REDACTED;
      if (typeof val === 'string' && val.length > 0) {
        out[`${key}_hash`] = sha256Prefix(val);
      }
    } else {
      out[key] = redact(val, depth + 1);
    }
  }
  return out;
}

function looksLikeToken(s: string): boolean {
  for (const re of TOKEN_LIKE_PATTERNS) {
    if (re.test(s)) return true;
  }
  return false;
}

function sha256Prefix(s: string): string {
  return 'sha256:' + createHash('sha256').update(s, 'utf-8').digest('hex').slice(0, 16);
}
