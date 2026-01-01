/**
 * get_custom_node_comments MCP Tool
 *
 * Get comments and ratings for a custom node.
 * Scope: custom_nodes:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CustomNodeComment } from '../types.js';

export const getCustomNodeCommentsTool: Tool = {
  name: 'get_custom_node_comments',
  description: 'Get comments and ratings for a custom node.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash)',
      },
    },
    required: ['node_id'],
  },
};

function formatComment(comment: CustomNodeComment, indent: number = 0): string[] {
  const prefix = '  '.repeat(indent);
  const lines = [
    `${prefix}**${comment.user_name}** (${comment.vote_count} votes) - ${comment.created_at}`,
    `${prefix}${comment.content}`,
  ];

  if (comment.replies && comment.replies.length > 0) {
    lines.push(`${prefix}Replies:`);
    for (const reply of comment.replies) {
      lines.push(...formatComment(reply, indent + 1));
    }
  }

  lines.push('');
  return lines;
}

export async function handleGetCustomNodeComments(
  api: FlowDotApiClient,
  args: { node_id: string }
): Promise<CallToolResult> {
  try {
    const comments = await api.getCustomNodeComments(args.node_id);

    if (!comments || comments.length === 0) {
      return {
        content: [{ type: 'text', text: 'No comments found for this custom node.' }],
      };
    }

    const lines = [
      `## Comments for Custom Node`,
      ``,
      `Total comments: ${comments.length}`,
      ``,
    ];

    for (const comment of comments) {
      lines.push(...formatComment(comment));
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting custom node comments: ${message}` }],
      isError: true,
    };
  }
}
