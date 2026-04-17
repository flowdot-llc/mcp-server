/**
 * get_execution_history MCP Tool
 *
 * Gets past execution history for a workflow.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getExecutionHistoryTool: Tool = {
  name: 'get_execution_history',
  description: 'Get past execution history for a workflow including timestamps, status, and duration.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination',
        default: 1,
      },
      limit: {
        type: 'number',
        description: 'Number of results per page (max 50)',
        default: 20,
      },
      include_audit_log: {
        type: 'boolean',
        description: 'When true, include the TRUST audit log (provider/model attribution, token counts) for each execution that has LLM node data.',
        default: false,
      },
    },
    required: ['workflow_id'],
  },
};

export async function handleGetExecutionHistory(
  api: FlowDotApiClient,
  args: { workflow_id: string; page?: number; limit?: number; include_audit_log?: boolean }
): Promise<CallToolResult> {
  try {
    const result = await api.getExecutionHistory(args.workflow_id, args.page, args.limit);

    // Handle unexpected response formats
    const executions = Array.isArray(result?.data) ? result.data : [];

    if (executions.length === 0) {
      return {
        content: [{ type: 'text', text: 'No execution history found for this workflow.' }],
      };
    }

    const lines = [
      `## Execution History (Page ${result?.current_page || 1}/${result?.last_page || 1}, Total: ${result?.total || executions.length})`,
      '',
    ];

    for (const exec of executions.filter(e => e && typeof e === 'object')) {
      const duration = exec.duration_ms ? `${exec.duration_ms}ms` : 'N/A';
      const status = (exec.status || 'unknown').toUpperCase();
      lines.push(`- **${exec.execution_id}** [${status}]`);
      lines.push(`  Started: ${exec.started_at || 'N/A'} | Duration: ${duration}`);
      if (exec.description) {
        lines.push(`  ${exec.description}`);
      }

      // TRUST P3 AUDIT: include audit log entries if requested
      if (args.include_audit_log && Array.isArray(exec.audit_log) && exec.audit_log.length > 0) {
        lines.push(`  **LLM Audit (${exec.audit_log.length} node${exec.audit_log.length !== 1 ? 's' : ''}):**`);
        for (const entry of exec.audit_log) {
          const provider = [entry.provider, entry.underlyingProvider, entry.model].filter(Boolean).join('/');
          const tokens = entry.inputTokens !== null && entry.inputTokens !== undefined
            ? `  ${entry.inputTokens} in / ${entry.outputTokens ?? 0} out tok`
            : '';
          lines.push(`    - ${entry.nodeTitle || entry.nodeType || entry.nodeId} via ${provider || 'unknown'}${tokens}`);
        }
      }
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting execution history: ${message}` }],
      isError: true,
    };
  }
}
