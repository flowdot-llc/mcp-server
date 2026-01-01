/**
 * get_workflow_public_url MCP Tool
 *
 * Gets the public URL for a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getWorkflowPublicUrlTool: Tool = {
  name: 'get_workflow_public_url',
  description: 'Get the public shareable URL for a workflow. Returns the URL and indicates if the workflow is currently accessible to others.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
    },
    required: ['workflow_id'],
  },
};

export async function handleGetWorkflowPublicUrl(
  api: FlowDotApiClient,
  args: { workflow_id: string }
): Promise<CallToolResult> {
  try {
    const result = await api.getWorkflowPublicUrl(args.workflow_id);

    const lines = [
      `## Public URL for "${result.workflow_name}"`,
      '',
      `**URL:** ${result.public_url}`,
      '',
      `**Status:** ${result.is_public ? '✓ Public' : '✗ Private'}`,
      '',
      result.message,
    ];

    if (!result.is_public) {
      lines.push('');
      lines.push('> Tip: Use `toggle_workflow_public` tool to make this workflow public.');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting workflow public URL: ${message}` }],
      isError: true,
    };
  }
}
