/**
 * TRUST P3 AUDIT: get_execution_history MCP tool handler tests
 * Covers include_audit_log behaviour added in Phase 2.
 *
 * @license
 * Copyright 2026 FlowDot
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { handleGetExecutionHistory, getExecutionHistoryTool } from './get-execution-history.js';
import type { FlowDotApiClient } from '../api-client.js';

const BASE_EXEC = {
  execution_id: 'exec-abc123',
  status: 'completed',
  description: 'Test run',
  started_at: '2026-04-17T10:00:00Z',
  duration_ms: 1234,
  created_at: '2026-04-17T10:00:00Z',
};

function makeApi(executions: object[], overrides?: { current_page?: number; last_page?: number; total?: number }): FlowDotApiClient {
  return {
    getExecutionHistory: vi.fn().mockResolvedValue({
      data: executions,
      current_page: overrides?.current_page ?? 1,
      last_page: overrides?.last_page ?? 1,
      total: overrides?.total ?? executions.length,
    }),
  } as unknown as FlowDotApiClient;
}

describe('getExecutionHistoryTool (definition)', () => {
  it('should have the correct tool name', () => {
    expect(getExecutionHistoryTool.name).toBe('get_execution_history');
  });

  it('should require workflow_id', () => {
    expect(getExecutionHistoryTool.inputSchema.required).toContain('workflow_id');
  });

  it('should expose include_audit_log as optional boolean parameter', () => {
    const props = getExecutionHistoryTool.inputSchema.properties as Record<string, { type: string; default?: unknown }>;
    expect(props.include_audit_log).toBeDefined();
    expect(props.include_audit_log.type).toBe('boolean');
    expect(props.include_audit_log.default).toBe(false);
  });
});

describe('handleGetExecutionHistory', () => {
  describe('basic execution listing', () => {
    it('should return "no history" message when list is empty', async () => {
      const api = makeApi([]);
      const result = await handleGetExecutionHistory(api, { workflow_id: 'wf123' });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('No execution history found');
    });

    it('should list execution IDs and statuses', async () => {
      const api = makeApi([BASE_EXEC]);
      const result = await handleGetExecutionHistory(api, { workflow_id: 'wf123' });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('exec-abc123');
      expect(text).toContain('COMPLETED');
    });

    it('should display duration when present', async () => {
      const api = makeApi([BASE_EXEC]);
      const result = await handleGetExecutionHistory(api, { workflow_id: 'wf123' });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('1234ms');
    });

    it('should call api with correct workflow_id, page and limit', async () => {
      const api = makeApi([]);
      await handleGetExecutionHistory(api, { workflow_id: 'wf-xyz', page: 2, limit: 10 });

      expect(api.getExecutionHistory).toHaveBeenCalledWith('wf-xyz', 2, 10);
    });

    it('should show pagination info in header', async () => {
      const api = makeApi([BASE_EXEC], { current_page: 2, last_page: 5, total: 50 });
      const result = await handleGetExecutionHistory(api, { workflow_id: 'wf123' });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('Page 2/5');
      expect(text).toContain('Total: 50');
    });
  });

  describe('audit_log rendering (include_audit_log: true)', () => {
    const execWithAudit = {
      ...BASE_EXEC,
      audit_log: [
        {
          nodeId: 'node-1',
          nodeTitle: 'Summarise Text',
          nodeType: 'llm',
          provider: 'anthropic',
          underlyingProvider: null,
          model: 'claude-sonnet-4-6',
          inputTokens: 512,
          outputTokens: 128,
        },
        {
          nodeId: 'node-2',
          nodeTitle: 'Extract Data',
          nodeType: 'llm',
          provider: 'openai',
          underlyingProvider: 'openai',
          model: 'gpt-4o',
          inputTokens: 256,
          outputTokens: 64,
        },
      ],
    };

    it('should include audit log entries when include_audit_log is true', async () => {
      const api = makeApi([execWithAudit]);
      const result = await handleGetExecutionHistory(api, {
        workflow_id: 'wf123',
        include_audit_log: true,
      });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('Summarise Text');
      expect(text).toContain('anthropic');
    });

    it('should show token counts in audit output', async () => {
      const api = makeApi([execWithAudit]);
      const result = await handleGetExecutionHistory(api, {
        workflow_id: 'wf123',
        include_audit_log: true,
      });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('512');
      expect(text).toContain('128');
    });

    it('should list all audit nodes', async () => {
      const api = makeApi([execWithAudit]);
      const result = await handleGetExecutionHistory(api, {
        workflow_id: 'wf123',
        include_audit_log: true,
      });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('Extract Data');
      expect(text).toContain('gpt-4o');
    });

    it('should show LLM Audit count label', async () => {
      const api = makeApi([execWithAudit]);
      const result = await handleGetExecutionHistory(api, {
        workflow_id: 'wf123',
        include_audit_log: true,
      });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('LLM Audit (2 nodes)');
    });

    it('should NOT include audit log entries when include_audit_log is false', async () => {
      const api = makeApi([execWithAudit]);
      const result = await handleGetExecutionHistory(api, {
        workflow_id: 'wf123',
        include_audit_log: false,
      });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).not.toContain('LLM Audit');
      expect(text).not.toContain('Summarise Text');
    });

    it('should NOT include audit log entries when include_audit_log is omitted', async () => {
      const api = makeApi([execWithAudit]);
      const result = await handleGetExecutionHistory(api, { workflow_id: 'wf123' });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).not.toContain('LLM Audit');
    });

    it('should skip audit section when audit_log is empty array', async () => {
      const api = makeApi([{ ...BASE_EXEC, audit_log: [] }]);
      const result = await handleGetExecutionHistory(api, {
        workflow_id: 'wf123',
        include_audit_log: true,
      });

      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).not.toContain('LLM Audit');
    });
  });

  describe('error handling', () => {
    it('should return isError on API exception', async () => {
      const api = {
        getExecutionHistory: vi.fn().mockRejectedValue(new Error('Network timeout')),
      } as unknown as FlowDotApiClient;

      const result = await handleGetExecutionHistory(api, { workflow_id: 'wf123' });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: 'text'; text: string }).text;
      expect(text).toContain('Network timeout');
    });
  });
});
