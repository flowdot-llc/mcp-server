/**
 * get_workflow_comments MCP Tool
 *
 * Gets user comments on a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { WorkflowComment } from '../types.js';

export const getWorkflowCommentsTool: Tool = {
  name: 'get_workflow_comments',
  description: 'Get user comments and ratings on a workflow. Only available for public workflows.',
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

function formatComment(comment: WorkflowComment, indent: string = ''): string {
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

export async function handleGetWorkflowComments(
  api: FlowDotApiClient,
  args: { workflow_id: string }
): Promise<CallToolResult> {
  try {
    const response = await api.getWorkflowComments(args.workflow_id);

    // Handle unexpected response formats
    const comments = Array.isArray(response) ? response : [];

    if (comments.length === 0) {
      return {
        content: [{ type: 'text', text: 'No comments on this workflow yet.' }],
      };
    }

    const formatted = comments
      .filter(c => c && typeof c === 'object')
      .map(c => formatComment(c))
      .join('\n\n---\n\n');

    return {
      content: [{ type: 'text', text: `## Workflow Comments (${comments.length})\n\n${formatted}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting workflow comments: ${message}` }],
      isError: true,
    };
  }
}
