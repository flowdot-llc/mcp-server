/**
 * list_workflows MCP Tool
 *
 * Lists workflows available to the user.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listWorkflowsTool: Tool = {
  name: 'list_workflows',
  description: 'List FlowDot workflows available to the user. Returns workflow IDs, names, and descriptions.',
  inputSchema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        description: 'Optional filter to search workflows by name',
      },
      favorites_only: {
        type: 'boolean',
        default: false,
        description: 'Only return favorited workflows',
      },
    },
  },
};

export async function handleListWorkflows(
  api: FlowDotApiClient,
  args: { filter?: string; favorites_only?: boolean }
): Promise<CallToolResult> {
  try {
    const response = await api.listWorkflows(args.filter, args.favorites_only);

    // Handle unexpected response formats
    const workflows = Array.isArray(response) ? response : [];

    if (workflows.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No workflows found. Create workflows at https://flowdot.ai to get started.',
          },
        ],
      };
    }

    // Format as a readable list
    const workflowList = workflows
      .filter(w => w && typeof w === 'object')
      .map((w) => {
        const desc = w.description ? ` - ${w.description}` : '';
        const visibility = w.is_public ? ' (public)' : '';
        return `- **${w.name}** (${w.id})${visibility}${desc}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${workflows.length} workflow(s):\n\n${workflowList}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error listing workflows: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
