/**
 * get_shared_result_comments MCP Tool
 *
 * Gets comments on a shared execution result.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { SharedResultComment } from '../types.js';

export const getSharedResultCommentsTool: Tool = {
  name: 'get_shared_result_comments',
  description: 'Get user comments on a shared execution result.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      result_hash: {
        type: 'string',
        description: 'The shared result hash',
      },
    },
    required: ['workflow_id', 'result_hash'],
  },
};

function formatComment(comment: SharedResultComment, indent: string = ''): string {
  const lines = [
    `${indent}**${comment.user_name}** (${comment.created_at})`,
    `${indent}${comment.content}`,
    `${indent}Votes: ${comment.vote_count}`,
  ];

  if (comment.replies && comment.replies.length > 0) {
    lines.push(`${indent}Replies:`);
    for (const reply of comment.replies) {
      lines.push(formatComment(reply, indent + '  '));
    }
  }

  return lines.join('\n');
}

export async function handleGetSharedResultComments(
  api: FlowDotApiClient,
  args: { workflow_id: string; result_hash: string }
): Promise<CallToolResult> {
  try {
    const comments = await api.getSharedResultComments(args.workflow_id, args.result_hash);

    if (!comments || comments.length === 0) {
      return {
        content: [{ type: 'text', text: 'No comments on this shared result yet.' }],
      };
    }

    const formatted = comments
      .filter(c => c && typeof c === 'object')
      .map(c => formatComment(c))
      .join('\n\n---\n\n');

    return {
      content: [{ type: 'text', text: `## Shared Result Comments (${comments.length})\n\n${formatted}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting shared result comments: ${message}` }],
      isError: true,
    };
  }
}
