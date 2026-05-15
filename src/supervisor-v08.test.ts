/**
 * v0.8 wiring tests for the mcp-server supervisor: honeytokens, capability
 * tags + Yellow tripwires, per-capability rate limits, attestor on close.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AuditLogReader,
  defineHoneytokenSet,
  type AttestationPayload,
  type Attestor,
} from '@flowdot.ai/guardian-agent';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSupervisor, runUnderSupervisor } from './supervisor.js';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'mcp-sup-v08-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

async function readRecords(path: string) {
  const reader = await AuditLogReader.open(path);
  const records = [];
  for await (const r of reader.records()) records.push(r);
  await reader.close();
  return records;
}

describe('mcp-server supervisor v0.8 wiring', () => {
  it('honeytoken value in args returns isError + audit row', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      honeytokens: defineHoneytokenSet('mcp-test', [
        { id: 'k', value: 'fd_honey_mcp_xyz' },
      ]),
    });
    const result = await runUnderSupervisor(
      supervisor!,
      'probe',
      async () => ({ content: [{ type: 'text', text: 'never' }] }),
      { creds: 'fd_honey_mcp_xyz' },
    );
    await supervisor!.close();

    expect(result.isError).toBe(true);
    const recs = await readRecords(supervisor!.auditPath);
    expect(recs.some((r) => r.kind === ('x_honeytoken_triggered' as unknown))).toBe(true);
  });

  it('capability Yellow event fires on the exfil-shape combination', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      capabilityRules: [
        {
          id: 'exfil',
          combination: ['credential', 'network-egress', 'write'],
          window_ms: 60_000,
          level: 'yellow',
        },
      ],
    });
    await runUnderSupervisor(
      supervisor!,
      'read_cred',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      {},
      undefined,
      ['credential'],
    );
    await runUnderSupervisor(
      supervisor!,
      'fetch_url',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      {},
      undefined,
      ['network-egress'],
    );
    await runUnderSupervisor(
      supervisor!,
      'write_kv',
      async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      {},
      undefined,
      ['write'],
    );
    await supervisor!.close();

    const recs = await readRecords(supervisor!.auditPath);
    const yellow = recs.find((r) => r.kind === ('x_capability_yellow' as unknown));
    expect(yellow).toBeDefined();
    expect(yellow?.detail?.rule_id).toBe('exfil');
  });

  it('per-class rate limit denies third credential call with class on the audit row', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      bucketOverrides: { credential: { maxCallsPerSecond: 2 } },
    });
    const r1 = await runUnderSupervisor(
      supervisor!,
      'cred1',
      async () => ({ content: [{ type: 'text', text: '1' }] }),
      {},
      undefined,
      ['credential'],
    );
    const r2 = await runUnderSupervisor(
      supervisor!,
      'cred2',
      async () => ({ content: [{ type: 'text', text: '2' }] }),
      {},
      undefined,
      ['credential'],
    );
    const r3 = await runUnderSupervisor(
      supervisor!,
      'cred3',
      async () => ({ content: [{ type: 'text', text: '3' }] }),
      {},
      undefined,
      ['credential'],
    );
    expect(r1.isError).toBeFalsy();
    expect(r2.isError).toBeFalsy();
    expect(r3.isError).toBe(true);
    await supervisor!.close();

    const recs = await readRecords(supervisor!.auditPath);
    const breach = recs.find((r) => r.kind === ('x_rate_limit_breached' as unknown));
    expect(breach?.detail?.class).toBe('credential');
  });

  it('attestor receives chain head on close', async () => {
    const payloads: AttestationPayload[] = [];
    const a: Attestor = {
      publish: (p) => {
        payloads.push(p);
        return { receiptId: `r-${payloads.length}` };
      },
    };
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      attestor: a,
      attestEvery: 1000,
    });
    await runUnderSupervisor(supervisor!, 'noop', async () => ({
      content: [{ type: 'text', text: 'ok' }],
    }));
    await supervisor!.close();
    expect(payloads.length).toBeGreaterThanOrEqual(1);
  });
});
