/**
 * add_custom_node_comment MCP Tool
 *
 * Add a comment to a custom node.
 * Scope: custom_nodes:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const addCustomNodeCommentTool: Tool = {
  name: 'add_custom_node_comment',
  description: 'Add a comment to a custom node. Can also be used to reply to existing comments.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash)',
      },
      content: {
        type: 'string',
        description: 'The comment text (max 2000 characters)',
      },
      parent_id: {
        type: 'number',
        description: 'Optional parent comment ID to reply to an existing comment',
      },
    },
    required: ['node_id', 'content'],
  },
};

export async function handleAddCustomNodeComment(
  api: FlowDotApiClient,
  args: { node_id: string; content: string; parent_id?: number }
): Promise<CallToolResult> {
  try {
    if (!args.content || args.content.trim().length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: Comment content cannot be empty.' }],
        isError: true,
      };
    }

    if (args.content.length > 2000) {
      return {
        content: [{ type: 'text', text: 'Error: Comment content must be under 2000 characters.' }],
        isError: true,
      };
    }

    const result = await api.addCustomNodeComment(args.node_id, args.content, args.parent_id);

    const lines = [
      `## Comment Added`,
      ``,
      `**Comment ID:** ${result.id}`,
      `**Author:** ${result.user_name}`,
      `**Posted:** ${result.created_at}`,
      ``,
      `**Content:**`,
      result.content,
    ];

    if (args.parent_id) {
      lines.splice(1, 0, `(Reply to comment #${args.parent_id})`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error adding comment: ${message}` }],
      isError: true,
    };
  }
}
