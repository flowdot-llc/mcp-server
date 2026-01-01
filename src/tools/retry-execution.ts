/**
 * retry_execution MCP Tool
 *
 * Retries a failed workflow execution with the same inputs.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const retryExecutionTool: Tool = {
  name: 'retry_execution',
  description: 'Retry a failed workflow execution using the same inputs. Creates a new execution.',
  inputSchema: {
    type: 'object',
    properties: {
      execution_id: {
        type: 'string',
        description: 'The failed execution ID to retry',
      },
    },
    required: ['execution_id'],
  },
};

export async function handleRetryExecution(
  api: FlowDotApiClient,
  args: { execution_id: string }
): Promise<CallToolResult> {
  try {
    const result = await api.retryExecution(args.execution_id);

    const lines = [
      '## Execution Retry Started',
      '',
      `**New Execution ID:** ${result.execution_id}`,
      `**Original Execution:** ${result.original_execution_id}`,
      `**Status:** ${result.status}`,
    ];

    if (result.message) {
      lines.push('', result.message);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error retrying execution: ${message}` }],
      isError: true,
    };
  }
}
