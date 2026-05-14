/**
 * v0.9 wiring tests for the mcp-server supervisor: two-key operator gate
 * + heartbeat (opt-in).
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AuditLogReader,
  callbackOperatorGate,
  denyAllOperatorGate,
} from '@flowdot-llc/guardian-agent';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSupervisor } from './supervisor.js';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'mcp-sup-v09-'));
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

describe('mcp-server supervisor v0.9 wiring', () => {
  it('operator gate approves + records gate_id correlation', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      operatorGate: callbackOperatorGate(() => ({
        decision: 'approved',
        operator_id: 'mcp-op-1',
      })),
    });
    const t = supervisor!.runtime.tool(async () => 'ran', {
      name: 'sensitive',
      requiresOperatorConfirmation: true,
      operatorConfirmationReason: 'test',
    });
    const r = await t();
    expect(r).toBe('ran');
    await supervisor!.close();

    const recs = await readRecords(supervisor!.auditPath);
    const pending = recs.find((r) => r.status === 'pending_operator');
    const approved = recs.find(
      (r) => r.kind === 'policy_check' && r.status === 'approved' && r.detail?.gate_id,
    );
    expect(approved?.detail?.gate_id).toBe(pending?.detail?.gate_id);
    expect(approved?.detail?.operator_id).toBe('mcp-op-1');
  });

  it('denyAll gate fails-closed without dispatching', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      operatorGate: denyAllOperatorGate('test-deny'),
    });
    const t = supervisor!.runtime.tool(async () => 'never', {
      name: 'sensitive',
      requiresOperatorConfirmation: true,
    });
    await expect(t()).rejects.toThrow(/operator denied/);
    await supervisor!.close();
    const recs = await readRecords(supervisor!.auditPath);
    expect(recs.some((r) => r.kind === 'tool_call')).toBe(false);
  });

  it('heartbeat default OFF (no field exposed)', async () => {
    const supervisor = await createSupervisor({ auditDir: tmp, keyDir: tmp });
    expect(supervisor!.heartbeat).toBeNull();
    await supervisor!.close();
  });

  it('heartbeat opt-in presses estop on hard miss', async () => {
    const supervisor = await createSupervisor({
      auditDir: tmp,
      keyDir: tmp,
      heartbeat: { softMs: 50, hardMs: 150 },
    });
    expect(supervisor!.heartbeat).not.toBeNull();
    await new Promise((r) => setTimeout(r, 300));
    expect(supervisor!.estop.isPressed()).toBe(true);
    await supervisor!.close();
    const recs = await readRecords(supervisor!.auditPath);
    const press = recs.find((r) => r.kind === 'estop_press');
    expect(press?.detail?.reason).toBe('heartbeat_missed');
  });
});
