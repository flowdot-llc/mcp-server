/**
 * get_execution_status MCP Tool
 *
 * Gets the status and results of a workflow execution.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getExecutionTool: Tool = {
  name: 'get_execution_status',
  description:
    'Get the status and results of a workflow execution. Use after execute_workflow with wait_for_completion=false.',
  inputSchema: {
    type: 'object',
    properties: {
      execution_id: {
        type: 'string',
        description: 'The execution ID to check',
      },
    },
    required: ['execution_id'],
  },
};

export async function handleGetExecution(
  api: FlowDotApiClient,
  args: { execution_id: string }
): Promise<CallToolResult> {
  try {
    const execution = await api.getExecution(args.execution_id);

    // Build status message
    let statusEmoji = '';
    switch (execution.status) {
      case 'completed':
        statusEmoji = 'Completed';
        break;
      case 'running':
        statusEmoji = 'Running...';
        break;
      case 'pending':
        statusEmoji = 'Pending';
        break;
      case 'failed':
        statusEmoji = 'Failed';
        break;
      case 'cancelled':
        statusEmoji = 'Cancelled';
        break;
    }

    let text = `Execution Status: ${statusEmoji}\n`;
    text += `Execution ID: ${execution.execution_id}\n`;

    if (execution.started_at) {
      text += `Started: ${execution.started_at}\n`;
    }

    if (execution.completed_at) {
      text += `Completed: ${execution.completed_at}\n`;
    }

    if (execution.duration_ms) {
      text += `Duration: ${(execution.duration_ms / 1000).toFixed(2)}s\n`;
    }

    if (execution.error) {
      text += `\nError: ${execution.error}\n`;
    }

    if (execution.outputs && Object.keys(execution.outputs).length > 0) {
      text += `\nOutputs:\n${JSON.stringify(execution.outputs, null, 2)}`;
    }

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error getting execution status: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
