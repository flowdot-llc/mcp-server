/**
 * cancel_execution MCP Tool
 *
 * Cancels a running workflow execution.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const cancelExecutionTool: Tool = {
  name: 'cancel_execution',
  description: 'Cancel a running workflow execution. Only works on executions with status "running" or "pending".',
  inputSchema: {
    type: 'object',
    properties: {
      execution_id: {
        type: 'string',
        description: 'The execution ID to cancel',
      },
    },
    required: ['execution_id'],
  },
};

export async function handleCancelExecution(
  api: FlowDotApiClient,
  args: { execution_id: string }
): Promise<CallToolResult> {
  try {
    // API may return undefined (no data wrapper) or { message: "..." }
    const result = await api.cancelExecution(args.execution_id);

    const message = result?.message || `Execution ${args.execution_id} has been cancelled.`;

    return {
      content: [{ type: 'text', text: message }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error cancelling execution: ${message}` }],
      isError: true,
    };
  }
}
