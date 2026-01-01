/**
 * get_public_workflows MCP Tool
 *
 * Gets public workflows from all users.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getPublicWorkflowsTool: Tool = {
  name: 'get_public_workflows',
  description: 'Browse public workflows shared by other users. Returns paginated results with workflow details.',
  inputSchema: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        description: 'Page number for pagination',
        default: 1,
      },
      sort_by: {
        type: 'string',
        description: 'Sort order: popular, recent, or favorites',
        default: 'popular',
      },
    },
  },
};

export async function handleGetPublicWorkflows(
  api: FlowDotApiClient,
  args: { page?: number; sort_by?: string }
): Promise<CallToolResult> {
  try {
    const result = await api.getPublicWorkflows(args.page, args.sort_by);

    // Handle unexpected response formats
    const workflows = Array.isArray(result?.data) ? result.data : [];

    if (workflows.length === 0) {
      return {
        content: [{ type: 'text', text: 'No public workflows found.' }],
      };
    }

    const lines = [
      `## Public Workflows (Page ${result?.current_page || 1}/${result?.last_page || 1}, Total: ${result?.total || workflows.length})`,
      '',
    ];

    for (const workflow of workflows.filter(w => w && typeof w === 'object')) {
      const desc = workflow.description ? ` - ${workflow.description}` : '';
      const stats = `[Votes: ${workflow.vote_count || 0}, Favorites: ${workflow.favorite_count || 0}, Copies: ${workflow.copy_count || 0}]`;
      lines.push(`### ${workflow.name} (${workflow.id})`);
      lines.push(`By: ${workflow.user_name || 'Unknown'} | ${stats}`);
      if (desc) lines.push(desc);
      if (workflow.tags && Array.isArray(workflow.tags) && workflow.tags.length > 0) {
        lines.push(`Tags: ${workflow.tags.join(', ')}`);
      }
      lines.push('');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting public workflows: ${message}` }],
      isError: true,
    };
  }
}
