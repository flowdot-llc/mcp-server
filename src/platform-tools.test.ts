/**
 * Tests for the side-effect-free `platform-tools` re-export surface.
 *
 * FlowDot Native imports this module (NOT the package entry, which starts a
 * server) to run the platform tools itself. These tests lock the contract that
 * import surface depends on: the three symbols exist, `tools` is a well-formed
 * schema list, `dispatchToolCall` maps representative tool names to the right
 * FlowDotApiClient method, and `capabilitiesFor` classifies by verb.
 */

import { describe, it, expect, vi } from 'vitest';

import type { FlowDotApiClient } from './api-client.js';
import { tools, dispatchToolCall, capabilitiesFor } from './platform-tools.js';

describe('platform-tools re-export surface', () => {
  it('exports a non-empty, well-formed tools schema list', () => {
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(50);
    for (const tool of tools) {
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeTruthy();
      expect((tool.inputSchema as { type?: string }).type).toBe('object');
    }
    // Spot-check the platform tools that motivated this work are present.
    const names = new Set(tools.map((t) => t.name));
    for (const expected of [
      'create_app',
      'update_app',
      'edit_app_code',
      'create_app_file',
      'publish_app',
      'create_custom_node',
      // Toolkit tools carry mcp-server's legacy doubled prefix in their name.
      'mcp__flowdot__list_installed_toolkits',
      'mcp__flowdot__invoke_toolkit_tool',
    ]) {
      expect(names.has(expected)).toBe(true);
    }
  });

  it('dispatchToolCall routes create_app to api.createApp', async () => {
    const created = { hash: 'APP123', name: 'QA' };
    const api = {
      createApp: vi.fn().mockResolvedValue(created),
    } as unknown as FlowDotApiClient;

    const result = await dispatchToolCall(api, {
      params: { name: 'create_app', arguments: { name: 'QA', code: '<h1>hi</h1>' } },
    });

    expect((api.createApp as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect(result.isError).toBeFalsy();
  });

  it('dispatchToolCall routes invoke_toolkit_tool to api.invokeToolkitTool', async () => {
    const api = {
      invokeToolkitTool: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as FlowDotApiClient;

    await dispatchToolCall(api, {
      params: {
        name: 'mcp__flowdot__invoke_toolkit_tool',
        arguments: { installation_id: '5', tool_name: 'search', inputs: { q: 'hi' } },
      },
    });

    expect((api.invokeToolkitTool as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });

  it('dispatchToolCall returns isError for an unknown tool', async () => {
    const api = {} as unknown as FlowDotApiClient;
    const result = await dispatchToolCall(api, {
      params: { name: 'definitely_not_a_tool', arguments: {} },
    });
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('Unknown tool');
  });

  it('capabilitiesFor classifies platform tools by verb', () => {
    expect(capabilitiesFor('create_app')).toContain('write');
    expect(capabilitiesFor('delete_app')).toContain('delete');
    expect(capabilitiesFor('mcp__flowdot__list_installed_toolkits')).toContain('read');
    expect(capabilitiesFor('mcp__flowdot__invoke_toolkit_tool')).toContain('execute');
    // Every platform tool is Hub-backed → network-egress + credential shape.
    expect(capabilitiesFor('create_app')).toContain('network-egress');
  });
});
