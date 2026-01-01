/**
 * get_execution_history MCP Tool
 *
 * Gets past execution history for a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

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
    },
    required: ['workflow_id'],
  },
};

export async function handleGetExecutionHistory(
  api: FlowDotApiClient,
  args: { workflow_id: string; page?: number; limit?: number }
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
