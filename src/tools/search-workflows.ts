/**
 * search_workflows MCP Tool
 *
 * Searches workflows by name, description, or tags.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const searchWorkflowsTool: Tool = {
  name: 'search_workflows',
  description: 'Search for workflows by name, description, or tags. Searches your own workflows.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to match against workflow name, description, or tags',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Filter results to only include workflows with these tags',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination',
        default: 1,
      },
    },
    required: ['query'],
  },
};

export async function handleSearchWorkflows(
  api: FlowDotApiClient,
  args: { query: string; tags?: string[]; page?: number }
): Promise<CallToolResult> {
  try {
    const result = await api.searchWorkflows(args.query, args.tags, args.page);

    // The API client returns the full paginated result object
    // which has { data: [...], current_page, last_page, total, ... }
    const workflows = Array.isArray(result?.data) ? result.data : [];

    if (workflows.length === 0) {
      return {
        content: [{ type: 'text', text: `No workflows found matching "${args.query}".` }],
      };
    }

    const lines = [
      `## Search Results for "${args.query}" (Page ${result?.current_page || 1}/${result?.last_page || 1}, Total: ${result?.total || workflows.length})`,
      '',
    ];

    for (const workflow of workflows) {
      const desc = workflow.description ? ` - ${workflow.description}` : '';
      const visibility = workflow.is_public ? ' (public)' : '';
      lines.push(`- **${workflow.name}** (${workflow.id})${visibility}${desc}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error searching workflows: ${message}` }],
      isError: true,
    };
  }
}
