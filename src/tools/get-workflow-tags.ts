/**
 * get_workflow_tags MCP Tool
 *
 * Gets the tags associated with a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getWorkflowTagsTool: Tool = {
  name: 'get_workflow_tags',
  description: 'Get the tags/categories associated with a workflow.',
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

export async function handleGetWorkflowTags(
  api: FlowDotApiClient,
  args: { workflow_id: string }
): Promise<CallToolResult> {
  try {
    const result = await api.getWorkflowTags(args.workflow_id);

    // API returns { workflow_id, tags: [...] }
    const tags = Array.isArray(result?.tags) ? result.tags : [];

    if (tags.length === 0) {
      return {
        content: [{ type: 'text', text: 'This workflow has no tags.' }],
      };
    }

    return {
      content: [{ type: 'text', text: `**Tags:** ${tags.join(', ')}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting workflow tags: ${message}` }],
      isError: true,
    };
  }
}
