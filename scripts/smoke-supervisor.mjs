/**
 * Smoke test: spin up a supervisor in a tmp dir, dispatch a fake tool call
 * via runUnderSupervisor, then verify the resulting audit log with
 * AuditLogReader. No Hub connection needed; pure local smoke.
 *
 * Run from mcp-server/: node scripts/smoke-supervisor.mjs
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AuditLogReader } from '@flowdot-llc/guardian-agent';
import { createSupervisor, runUnderSupervisor } from '../dist/supervisor.js';

const tmp = mkdtempSync(join(tmpdir(), 'mcp-smoke-'));
console.error(`smoke: tmp dir ${tmp}`);

const supervisor = await createSupervisor({ auditDir: tmp });
if (!supervisor) {
  console.error('smoke: supervisor disabled — abort');
  process.exit(1);
}

console.error(`smoke: audit log at ${supervisor.auditPath}`);

const r1 = await runUnderSupervisor(supervisor, 'list_workflows', async () => ({
  content: [{ type: 'text', text: 'mock-list-result' }],
}));
console.error(`smoke: list_workflows ok — content=${JSON.stringify(r1.content)}`);

const r2 = await runUnderSupervisor(supervisor, 'get_workflow_details', async () => ({
  content: [{ type: 'text', text: 'mock-details-result' }],
}));
console.error(`smoke: get_workflow_details ok`);

// Press estop; next call should refuse.
await supervisor.estop.press({ reason: 'smoke_test_halt' });
const r3 = await runUnderSupervisor(supervisor, 'execute_workflow', async () => ({
  content: [{ type: 'text', text: 'should not see this' }],
}));
console.error(`smoke: after estop — isError=${r3.isError}`);

await supervisor.close();

const reader = await AuditLogReader.open(supervisor.auditPath);
const count = await reader.verifyChain();
await reader.close();

const records = [];
const r2reader = await AuditLogReader.open(supervisor.auditPath);
for await (const rec of r2reader.records()) records.push(rec);
await r2reader.close();

const kinds = records.map((r) => r.kind);
console.error(`smoke: hash chain verified — ${count} records`);
console.error(`smoke: kinds in order — ${kinds.join(', ')}`);

const expected = [
  'session_open',
  'tool_call',
  'policy_check',
  'tool_result',
  'tool_call',
  'policy_check',
  'tool_result',
  'estop_press',
  'policy_check',
  'session_close',
];
const ok = JSON.stringify(kinds) === JSON.stringify(expected);
if (!ok) {
  console.error(`smoke: FAIL — expected ${JSON.stringify(expected)}`);
  process.exit(1);
}

rmSync(tmp, { recursive: true, force: true });
console.error('smoke: ALL CHECKS PASSED ✔');
