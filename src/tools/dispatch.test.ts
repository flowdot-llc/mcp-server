/**
 * Tests for the dispatch wrapping in registerTools.
 *
 * Builds a Server, registers tools with a supervisor, then invokes the
 * CallTool request handler programmatically and verifies the audit
 * sequence shows up in the supervisor's audit log.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AuditLogReader } from '@flowdot-llc/guardian-agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FlowDotApiClient } from '../api-client.js';
import { createSupervisor } from '../supervisor.js';
import { dispatchToolCall, registerTools } from './index.js';

let tmp: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'mcp-dispatch-'));
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

function makeApi(): FlowDotApiClient {
  // Stubs only the methods touched by the tools we call below.
  return {
    panicStop: vi.fn().mockResolvedValue({
      stopped: ['exec-x'],
      stoppedAgents: [],
      count: 1,
    }),
    listWorkflows: vi.fn().mockResolvedValue({ data: [] }),
  } as unknown as FlowDotApiClient;
}

describe('dispatchToolCall (unsupervised path)', () => {
  it('returns isError for unknown tool', async () => {
    const api = makeApi();
    const result = await dispatchToolCall(api, {
      params: { name: 'no_such_tool', arguments: {} },
    });
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('Unknown tool: no_such_tool');
  });
});

describe('registerTools with supervisor', () => {
  it('routes a CallTool request through the supervisor and audits it', async () => {
    const api = makeApi();
    const supervisor = await createSupervisor({ auditDir: tmp });
    const server = new Server(
      { name: 'test', version: '0.0.0' },
      { capabilities: { tools: {} } },
    );
    registerTools(server, api, supervisor);

    // The Server exposes setRequestHandler; we recover the registered handler
    // by re-registering with a captured callback. Simpler: introspect via the
    // internal _requestHandlers map.
    const internal = server as unknown as {
      _requestHandlers: Map<string, (req: unknown) => Promise<CallToolResult>>;
    };
    const handler = internal._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    expect(handler).toBeDefined();

    const result = await handler!({
      method: 'tools/call',
      params: { name: 'panic_stop', arguments: { confirm: true } },
    });
    expect(result).toBeDefined();
    // panic_stop returns the formatted stopped-count output.
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('Panic Stop Complete');

    await supervisor!.close();

    const reader = await AuditLogReader.open(supervisor!.auditPath);
    const records = [];
    for await (const r of reader.records()) records.push(r);
    await reader.close();

    const kinds = records.map((r) => r.kind);
    expect(kinds).toContain('tool_call');
    expect(kinds).toContain('tool_result');
    const call = records.find((r) => r.kind === 'tool_call');
    expect(call?.tool?.name).toBe('panic_stop');
  });

  it('returns isError when supervisor halt is active', async () => {
    const api = makeApi();
    const supervisor = await createSupervisor({ auditDir: tmp });
    await supervisor!.estop.press({ reason: 'test_halt' });

    const server = new Server(
      { name: 'test', version: '0.0.0' },
      { capabilities: { tools: {} } },
    );
    registerTools(server, api, supervisor);

    const internal = server as unknown as {
      _requestHandlers: Map<string, (req: unknown) => Promise<CallToolResult>>;
    };
    const handler = internal._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    const result = await handler!({
      method: 'tools/call',
      params: { name: 'panic_stop', arguments: { confirm: true } },
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('emergency stop is active');

    // panic_stop should NOT have been invoked.
    expect(api.panicStop).not.toHaveBeenCalled();

    await supervisor!.close();
  });

  it('falls through to direct dispatch when no supervisor is supplied', async () => {
    const api = makeApi();
    const server = new Server(
      { name: 'test', version: '0.0.0' },
      { capabilities: { tools: {} } },
    );
    registerTools(server, api, null);

    const internal = server as unknown as {
      _requestHandlers: Map<string, (req: unknown) => Promise<CallToolResult>>;
    };
    const handler = internal._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    const result = await handler!({
      method: 'tools/call',
      params: { name: 'panic_stop', arguments: { confirm: true } },
    });
    expect(result).toBeDefined();
    expect(api.panicStop).toHaveBeenCalledOnce();
  });
});
