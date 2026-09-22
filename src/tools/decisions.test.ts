/**
 * Typed decision tools (JEV §2/§9, Amendment A10): inventory, categories, capabilities,
 * per-connection disclosure over a real MCP client/server pair, argument validation and typed
 * error normalization. The Hub is replaced by a fake shared client; no network.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { DecisionApiError, DecisionPendingError } from '@flowdot.ai/api';
import { describe, expect, it, vi } from 'vitest';

import type { FlowDotApiClient } from '../api-client.js';
import { dispatchToolCall, registerTools, tools } from './index.js';
import { registerResources } from '../resources/index.js';
import { createDecisionDisclosure } from '../decision-disclosure.js';
import { categoryForTool, toolsForCategories, learnAbout } from '../tool-categories.js';
import { capabilitiesFor } from '../tool-capabilities.js';

const NAMES = ['execute_decision', 'get_decision', 'cancel_decision', 'list_decision_models'];
const CALL = '00000000-0000-4000-8000-000000000001';
const models = { schema_version: 1, models: [], authorization: { can_execute: true, can_read: true, can_cancel: true, consent_version: 1 } };

function fakeApi() {
  return {
    executeDecision: vi.fn(async () => ({ call_id: CALL, execution_status: 'succeeded' })),
    getDecision: vi.fn(async () => ({ call_id: CALL })),
    cancelDecision: vi.fn(async () => ({ call_id: CALL, cancel_requested: true })),
    listDecisionModels: vi.fn(async () => models),
  };
}

async function connected(api: ReturnType<typeof fakeApi>) {
  const server = new Server({ name: 'test', version: '0' }, { capabilities: { tools: { listChanged: true }, resources: {} } });
  const disclosure = createDecisionDisclosure();
  registerTools(server, api as unknown as FlowDotApiClient, null, disclosure);
  registerResources(server, disclosure);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0' });
  const changed = vi.fn();
  client.setNotificationHandler(ToolListChangedNotificationSchema, changed);
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return { client, changed, disclosure };
}

describe('decision tool inventory and gating', () => {
  it('the static inventory (manifest source) always contains all four tools', () => {
    const names = tools.map((t) => t.name);
    for (const n of NAMES) expect(names).toContain(n);
  });
  it('they form their own opt-in category, never the default workflows bucket', () => {
    for (const n of NAMES) expect(categoryForTool(n)).toBe('decisions');
    expect(toolsForCategories(['workflows']).map((t) => t.name)).not.toContain('execute_decision');
    const learned = learnAbout('decisions');
    expect(learned.categoryToLoad).toBe('decisions');
    for (const n of NAMES) expect(learned.text).toContain(`- ${n}:`);
  });
  it('capability tags: execute/cancel are execute-shaped, get/list read-shaped, all Hub credentialed', () => {
    expect(capabilitiesFor('execute_decision')).toEqual(['execute', 'network-egress', 'credential']);
    expect(capabilitiesFor('cancel_decision')).toEqual(['execute', 'network-egress', 'credential']);
    expect(capabilitiesFor('get_decision')).toEqual(['read', 'network-egress', 'credential']);
    expect(capabilitiesFor('list_decision_models')).toEqual(['read', 'network-egress', 'credential']);
  });
});

describe('per-connection disclosure (A10)', () => {
  it('hidden and refused by name until learn://decisions is read, then listed with list_changed', async () => {
    const api = fakeApi();
    const { client, changed } = await connected(api);
    const before = (await client.listTools()).tools.map((t) => t.name);
    for (const n of NAMES) expect(before).not.toContain(n);
    expect(before).toContain('list_workflows');
    const refused = await client.callTool({ name: 'list_decision_models', arguments: {} });
    expect(refused.isError).toBe(true);
    expect(JSON.stringify(refused.content)).toContain('learn://decisions');
    expect(api.listDecisionModels).not.toHaveBeenCalled();

    const guide = await client.readResource({ uri: 'learn://decisions' });
    expect(JSON.stringify(guide.contents)).toContain('NOT a chat model');
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
    const after = (await client.listTools()).tools.map((t) => t.name);
    for (const n of NAMES) expect(after).toContain(n);
    const result = await client.callTool({ name: 'list_decision_models', arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual(models);
    // A second read does not re-announce.
    await client.readResource({ uri: 'learn://jev' });
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('other learn resources do not unlock decisions', async () => {
    const { client, disclosure } = await connected(fakeApi());
    await client.readResource({ uri: 'learn://recipes' });
    expect(disclosure.unlocked).toBe(false);
  });
});

describe('dispatch, validation and typed errors', () => {
  const request = (name: string, args: unknown) => ({ params: { name, arguments: args } });
  const input = { schema_version: 1, idempotency_key: '41a68610-bb45-4c60-aea7-127a42cc53ee', model: 'jev-1.13.0',
    state: 'Payouts failed.', questions: { q: { type: 'noul' } } };

  it('unknown or malformed arguments are refused before any Hub request', async () => {
    const api = fakeApi();
    const cases: Array<[string, unknown]> = [
      ['execute_decision', { ...input, payer_user_id: 7 }],
      ['execute_decision', { schema_version: 1 }],
      ['get_decision', { call_id: 'nope' }],
      ['cancel_decision', { call_id: CALL, extra: true }],
      ['list_decision_models', { refresh: true }],
    ];
    for (const [name, args] of cases) {
      const result = await dispatchToolCall(api as unknown as FlowDotApiClient, request(name, args));
      expect([name, result.isError, (result.structuredContent as { error: { code: string } }).error.code]).toEqual([name, true, 'invalid_request']);
    }
    expect(api.executeDecision).not.toHaveBeenCalled();
    expect(api.getDecision).not.toHaveBeenCalled();
  });

  it('passes the per-call signal to the shared client and returns the DecisionCall object', async () => {
    const api = fakeApi();
    const controller = new AbortController();
    const result = await dispatchToolCall(api as unknown as FlowDotApiClient, request('execute_decision', input), { signal: controller.signal });
    expect(api.executeDecision).toHaveBeenCalledWith(input, { signal: controller.signal });
    expect(result.structuredContent).toEqual({ call_id: CALL, execution_status: 'succeeded' });
    expect(JSON.parse((result.content[0] as { text: string }).text)).toEqual(result.structuredContent);
  });

  it('normalizes typed failures to isError with safe fields only', async () => {
    const api = fakeApi();
    api.executeDecision.mockRejectedValueOnce(new DecisionPendingError(input.idempotency_key, CALL));
    const pending = await dispatchToolCall(api as unknown as FlowDotApiClient, request('execute_decision', input));
    expect(pending.isError).toBe(true);
    expect(pending.structuredContent).toEqual({ error: { code: 'pending', status: null, call_id: CALL, safe_to_retry: false,
      idempotency_key: input.idempotency_key } });

    api.getDecision.mockRejectedValueOnce(new DecisionApiError('consent_required', 403));
    const refused = await dispatchToolCall(api as unknown as FlowDotApiClient, request('get_decision', { call_id: CALL }));
    expect((refused.structuredContent as { error: { code: string; status: number } }).error).toMatchObject({ code: 'consent_required', status: 403 });

    api.cancelDecision.mockRejectedValueOnce(new Error('upstream said: secret-canary state text'));
    const fault = await dispatchToolCall(api as unknown as FlowDotApiClient, request('cancel_decision', { call_id: CALL }));
    expect((fault.structuredContent as { error: { code: string } }).error.code).toBe('transport_error');
    expect(JSON.stringify(fault)).not.toContain('secret-canary');
  });
});
