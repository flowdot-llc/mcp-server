/**
 * Tests for the MCP supervisor wiring: audit log + EStopLocal + dispatch wrap.
 *
 * These tests cover the supervisor in isolation; they do not spin up a real
 * Server instance or test the full MCP protocol.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AuditLogReader } from '@flowdot.ai/guardian-agent';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSupervisor, runUnderSupervisor } from './supervisor.js';

let tmp: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'mcp-supervisor-'));
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

describe('createSupervisor', () => {
  it('builds a supervisor and writes session_open on creation', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    expect(supervisor).not.toBeNull();
    expect(supervisor!.auditPath).toBe(join(tmp, 'mcp.jsonl'));
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    expect(records[0]?.kind).toBe('session_open');
    expect(records[records.length - 1]?.kind).toBe('session_close');
  });

  it('returns null when enable=false', async () => {
    const supervisor = await createSupervisor({ enable: false });
    expect(supervisor).toBeNull();
  });

  it('returns null when FLOWDOT_SUPERVISOR=off', async () => {
    const prev = process.env.FLOWDOT_SUPERVISOR;
    process.env.FLOWDOT_SUPERVISOR = 'off';
    try {
      const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
      expect(supervisor).toBeNull();
    } finally {
      if (prev === undefined) {
        delete process.env.FLOWDOT_SUPERVISOR;
      } else {
        process.env.FLOWDOT_SUPERVISOR = prev;
      }
    }
  });

  it('creates the audit directory if missing', async () => {
    const nested = join(tmp, 'nested', 'audit');
    expect(existsSync(nested)).toBe(false);
    const supervisor = await createSupervisor({ auditDir: nested, keyDir: tmp });
    expect(supervisor).not.toBeNull();
    expect(existsSync(nested)).toBe(true);
    await supervisor!.close();
  });

  it('honors FLOWDOT_AUDIT_DIR env var', async () => {
    const prev = process.env.FLOWDOT_AUDIT_DIR;
    process.env.FLOWDOT_AUDIT_DIR = tmp;
    try {
      const supervisor = await createSupervisor({ keyDir: tmp });
      expect(supervisor!.auditPath).toBe(join(tmp, 'mcp.jsonl'));
      await supervisor!.close();
    } finally {
      if (prev === undefined) {
        delete process.env.FLOWDOT_AUDIT_DIR;
      } else {
        process.env.FLOWDOT_AUDIT_DIR = prev;
      }
    }
  });

  it('respects custom agent id, session id, and audit file', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp, keyDir: tmp,
      auditFile: 'special.jsonl',
      agentId: 'custom-agent',
      sessionId: 'sess_custom',
    });
    expect(supervisor!.auditPath).toBe(join(tmp, 'special.jsonl'));
    expect(supervisor!.runtime.agentId).toBe('custom-agent');
    expect(supervisor!.runtime.sessionId).toBe('sess_custom');
    await supervisor!.close();
  });
});

describe('runUnderSupervisor', () => {
  it('emits tool_call + policy_check + tool_result for a successful call', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    const result = await runUnderSupervisor(supervisor!, 'list_workflows', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();

    expect(result.content[0]).toEqual({ type: 'text', text: 'ok' });

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    const kinds = records.map((r) => r.kind);
    // session_open, tool_call, policy_check, tool_result, session_close.
    expect(kinds).toEqual([
      'session_open',
      'tool_call',
      'policy_check',
      'tool_result',
      'session_close',
    ]);
    const toolCall = records.find((r) => r.kind === 'tool_call');
    expect(toolCall?.tool?.name).toBe('list_workflows');
    const toolResult = records.find((r) => r.kind === 'tool_result');
    expect(toolResult?.status).toBe('executed');
  });

  it('emits errored tool_result on dispatch throw and re-throws', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });

    await expect(
      runUnderSupervisor(supervisor!, 'broken_tool', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow(/boom/);
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    const errored = records.find(
      (r) => r.kind === 'tool_result' && r.status === 'errored',
    );
    expect(errored).toBeDefined();
    expect(errored?.detail).toMatchObject({ error: 'boom' });
  });

  it('returns isError result when the estop is pressed', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });

    // Press the in-process estop.
    await supervisor!.estop.press({ reason: 'shutdown_for_test' });

    const result = await runUnderSupervisor(
      supervisor!,
      'list_workflows',
      async () => ({ content: [{ type: 'text', text: 'should not run' }] }),
    );
    await supervisor!.close();

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('emergency stop is active');
    expect(text).toContain('shutdown_for_test');

    // Audit must record the halted policy_check.
    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    const halted = records.find(
      (r) => r.kind === 'policy_check' && r.status === 'halted',
    );
    expect(halted).toBeDefined();
  });

  it('records ModelAttribution chain on tool_call', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(
      supervisor!,
      'send_email',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      { to: 'a@b' },
      {
        surface: 'FlowDot',
        aggregator: 'RedPill',
        provider: 'Anthropic',
        id: 'claude-opus-4.5',
      },
    );
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    const call = records.find((r) => r.kind === 'tool_call');
    expect(call?.model).toEqual({
      provider: 'Anthropic',
      id: 'claude-opus-4.5',
      surface: 'FlowDot',
      aggregator: 'RedPill',
    });
  });

  it('audit log passes verifyChain after several calls', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });

    await runUnderSupervisor(supervisor!, 'list_workflows', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await runUnderSupervisor(supervisor!, 'get_workflow_details', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const count = await reader.verifyChain();
    await reader.close();

    // session_open + (tool_call, policy_check, tool_result) * 2 + session_close
    expect(count).toBe(8);
  });

  it('records the tool name supplied by the caller', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(supervisor!, 'agent_chat', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    const call = records.find((r) => r.kind === 'tool_call');
    expect(call?.tool?.name).toBe('agent_chat');
  });

  it('is isolated per-supervisor: separate audit logs do not interfere', async () => {
    const supervisor1 = await createSupervisor({
      auditDir: tmp, keyDir: tmp,
      auditFile: 'one.jsonl',
      sessionId: 'sess_one',
    });
    const supervisor2 = await createSupervisor({
      auditDir: tmp, keyDir: tmp,
      auditFile: 'two.jsonl',
      sessionId: 'sess_two',
    });

    await runUnderSupervisor(supervisor1!, 't', async () => ({
      content: [{ type: 'text', text: 'one' }],
    }));
    await runUnderSupervisor(supervisor2!, 't', async () => ({
      content: [{ type: 'text', text: 'two' }],
    }));
    await supervisor1!.close();
    await supervisor2!.close();

    const records1 = [];
    const reader1 = await AuditLogReader.open(supervisor1!.auditPath);
    for await (const r of reader1.records()) records1.push(r);
    await reader1.close();

    const records2 = [];
    const reader2 = await AuditLogReader.open(supervisor2!.auditPath);
    for await (const r of reader2.records()) records2.push(r);
    await reader2.close();

    expect(records1.every((r) => r.session_id === 'sess_one')).toBe(true);
    expect(records2.every((r) => r.session_id === 'sess_two')).toBe(true);
  });
});

// ============================================================================
// Hardening: item 1 — signed audit records
// ============================================================================

describe('signed audit records', () => {
  it('signs every record when audit key is loaded', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(supervisor!, 'whoami', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    for (const r of records) {
      expect(r.signature).toMatch(/^ed25519:/);
    }
  });

  it('audit log verifies under guardian-verify-style chain + signature check', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();

    const { loadPublicKey } = await import('@flowdot.ai/guardian-agent');
    const { readFileSync } = await import('node:fs');
    const pubPem = readFileSync(supervisor!.publicKeyPath!, 'utf-8');
    const pubkey = loadPublicKey(pubPem);

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const chainCount = await reader.verifyChain();
    expect(chainCount).toBeGreaterThan(0);
    // Re-open for second iteration (verify chain consumed the iterator).
    await reader.close();
    const reader2 = await AuditLogReader.open(supervisor!.auditPath);
    const sigCount = await reader2.verifySignatures(pubkey);
    await reader2.close();
    expect(sigCount).toBe(chainCount);
  });

  it('does not sign when signWith=false', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      signWith: false,
    });
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();
    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    for (const r of records) {
      expect(r.signature).toBeNull();
    }
    expect(supervisor!.publicKeyPath).toBeNull();
  });
});

// ============================================================================
// Hardening: item 8 — session recovery
// ============================================================================

describe('session recovery', () => {
  it('writes x_session_recovered when prior session did not close cleanly', async () => {
    // First run: write a tool call but skip close() to simulate abnormal exit.
    const supervisor1 = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      sessionId: 'sess_first',
    });
    await runUnderSupervisor(supervisor1!, 'whoami', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    // Don't await supervisor1.close() — leave the chain hanging.

    // Second run: opens the same audit log; should detect the unclean tip.
    const supervisor2 = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      sessionId: 'sess_second',
    });
    await supervisor2!.close();

    const reader = await AuditLogReader.open(supervisor2!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    const recovered = records.find(
      (r) => r.kind === ('x_session_recovered' as unknown),
    );
    expect(recovered).toBeDefined();
    expect(recovered?.detail?.prior_session_id).toBe('sess_first');
    expect(recovered?.detail?.prior_kind).not.toBe('session_close');
  });

  it('does NOT write x_session_recovered after a clean shutdown', async () => {
    const s1 = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(s1!, 'whoami', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await s1!.close(); // clean shutdown → session_close lands

    const s2 = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await s2!.close();

    const reader = await AuditLogReader.open(s2!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    const recovered = records.find(
      (r) => r.kind === ('x_session_recovered' as unknown),
    );
    expect(recovered).toBeUndefined();
  });
});

// ============================================================================
// Hardening: item 4 — rate limiting
// ============================================================================

describe('rate limiting', () => {
  it('returns isError when bucket is empty', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      maxCallsPerSecond: 2,
    });
    // Drain the bucket (capacity == rate == 2).
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: '1' }],
    }));
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: '2' }],
    }));
    // 3rd call should be denied.
    const denied = await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: '3' }],
    }));
    expect(denied.isError).toBe(true);
    const text = (denied.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('Rate limit exceeded');
    await supervisor!.close();
  });

  it('emits a single x_rate_limit_breached audit event per burst', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      maxCallsPerSecond: 1,
    });
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: 'allowed' }],
    }));
    // Two denials in a row — should produce one breach record, not two.
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: 'denied' }],
    }));
    await runUnderSupervisor(supervisor!, 't', async () => ({
      content: [{ type: 'text', text: 'denied' }],
    }));
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    const breaches = records.filter(
      (r) => r.kind === ('x_rate_limit_breached' as unknown),
    );
    expect(breaches).toHaveLength(1);
  });

  it('disables rate-limiting when maxCallsPerSecond=0', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      maxCallsPerSecond: 0,
    });
    expect(supervisor!.rateLimiter).toBeNull();
    // 100 rapid calls should all succeed.
    for (let i = 0; i < 100; i++) {
      const r = await runUnderSupervisor(supervisor!, 't', async () => ({
        content: [{ type: 'text', text: String(i) }],
      }));
      expect(r.isError).toBeFalsy();
    }
    await supervisor!.close();
  });
});

// ============================================================================
// Hardening: item 5 — argument redaction
// ============================================================================

describe('argument redaction', () => {
  it('redacts password fields in audit args', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(
      supervisor!,
      'login',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      { user: 'elliot', password: 'super-secret' },
    );
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    // tool_call args show redaction.
    const call = records.find((r) => r.kind === 'tool_call');
    const args = call!.tool!.args as Record<string, unknown>;
    // The wrapper recorded one positional arg (the redacted object).
    const recorded = (args['0'] as Record<string, unknown>) ?? {};
    expect(recorded.user).toBe('elliot');
    expect(recorded.password).toBe('[REDACTED]');
    expect(typeof recorded.password_hash).toBe('string');
  });

  it('redacts token-shaped strings even when key is innocuous', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(
      supervisor!,
      'configure',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      { value: 'fd_mcp_abcdefghij1234567890_extra' },
    );
    await supervisor!.close();
    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    const call = records.find((r) => r.kind === 'tool_call');
    const args = call!.tool!.args as Record<string, unknown>;
    const recorded = (args['0'] as Record<string, unknown>) ?? {};
    expect(recorded.value).toBe('[REDACTED]');
  });
});

// ============================================================================
// Hardening: item 3 — panic_clear initiator warning
// ============================================================================

describe('panic_clear initiator warning', () => {
  it('writes an x_panic_clear_warning audit event before dispatch', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(
      supervisor!,
      'panic_clear',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      { confirm: true, password: 'hunter2' },
    );
    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    const warning = records.find(
      (r) => r.kind === ('x_panic_clear_warning' as unknown),
    );
    expect(warning).toBeDefined();
    expect(warning?.detail?.tool).toBe('panic_clear');
    expect(String(warning?.detail?.warning)).toContain('agent-initiated');
  });

  it('redacts the password arg on panic_clear', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    await runUnderSupervisor(
      supervisor!,
      'panic_clear',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      { confirm: true, password: 'hunter2' },
    );
    await supervisor!.close();
    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();
    const call = records.find((r) => r.kind === 'tool_call');
    const args = call!.tool!.args as Record<string, unknown>;
    const recorded = (args['0'] as Record<string, unknown>) ?? {};
    expect(recorded.password).toBe('[REDACTED]');
  });
});
