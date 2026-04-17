/**
 * TRUST P4: panic_stop MCP tool handler tests
 *
 * @license
 * Copyright 2026 FlowDot
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePanicStop, panicStopTool } from './panic-stop.js';
import type { FlowDotApiClient } from '../api-client.js';

// Minimal mock of the API client
function makeMockApi(overrides: Partial<FlowDotApiClient> = {}): FlowDotApiClient {
  return {
    panicStop: vi.fn().mockResolvedValue({
      stopped: ['exec-abc', 'exec-def'],
      stoppedAgents: ['sess-1'],
      count: 3,
      message: 'Panic stop complete',
    }),
    ...overrides,
  } as unknown as FlowDotApiClient;
}

describe('panicStopTool (definition)', () => {
  it('should have the correct tool name', () => {
    expect(panicStopTool.name).toBe('panic_stop');
  });

  it('should require confirm parameter', () => {
    expect(panicStopTool.inputSchema.required).toContain('confirm');
  });

  it('should describe confirm as boolean', () => {
    const props = panicStopTool.inputSchema.properties as Record<string, { type: string }>;
    expect(props.confirm.type).toBe('boolean');
  });
});

describe('handlePanicStop', () => {
  let api: FlowDotApiClient;

  beforeEach(() => {
    api = makeMockApi();
  });

  it('should return an error when confirm is false', async () => {
    const result = await handlePanicStop(api, { confirm: false });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as { type: 'text'; text: string }).text).toContain('confirm must be set to true');
  });

  it('should NOT call api.panicStop() when confirm is false', async () => {
    await handlePanicStop(api, { confirm: false });

    expect(api.panicStop).not.toHaveBeenCalled();
  });

  it('should call api.panicStop() when confirm is true', async () => {
    await handlePanicStop(api, { confirm: true });

    expect(api.panicStop).toHaveBeenCalledOnce();
  });

  it('should format stopped execution IDs in output', async () => {
    const result = await handlePanicStop(api, { confirm: true });

    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('exec-abc');
    expect(text).toContain('exec-def');
  });

  it('should format stopped agent session IDs in output', async () => {
    const result = await handlePanicStop(api, { confirm: true });

    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('sess-1');
  });

  it('should report zero processes when nothing was running', async () => {
    api = makeMockApi({
      panicStop: vi.fn().mockResolvedValue({
        stopped: [],
        stoppedAgents: [],
        count: 0,
        message: 'No active executions',
      }),
    } as Partial<FlowDotApiClient>);

    const result = await handlePanicStop(api, { confirm: true });

    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('No active executions');
    expect(result.isError).toBeFalsy();
  });

  it('should return isError on api exception', async () => {
    api = makeMockApi({
      panicStop: vi.fn().mockRejectedValue(new Error('Connection refused')),
    } as Partial<FlowDotApiClient>);

    const result = await handlePanicStop(api, { confirm: true });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('Connection refused');
  });

  it('should not be marked as error on success', async () => {
    const result = await handlePanicStop(api, { confirm: true });

    expect(result.isError).toBeFalsy();
    expect(result.content.length).toBeGreaterThan(0);
  });
});
