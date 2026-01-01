/**
 * add_workflow_comment MCP Tool
 *
 * Adds a comment to a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const addWorkflowCommentTool: Tool = {
  name: 'add_workflow_comment',
  description: 'Add a comment to a workflow. You can only comment on public workflows or your own workflows.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      content: {
        type: 'string',
        description: 'The comment content (max 2000 characters)',
      },
      parent_id: {
        type: 'number',
        description: 'Optional parent comment ID for replies',
      },
    },
    required: ['workflow_id', 'content'],
  },
};

export async function handleAddWorkflowComment(
  api: FlowDotApiClient,
  args: { workflow_id: string; content: string; parent_id?: number }
): Promise<CallToolResult> {
  try {
    // Validate content length
    if (!args.content || args.content.trim().length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: Comment content cannot be empty.' }],
        isError: true,
      };
    }

    if (args.content.length > 2000) {
      return {
        content: [{ type: 'text', text: 'Error: Comment content exceeds maximum length of 2000 characters.' }],
        isError: true,
      };
    }

    const result = await api.addWorkflowComment(
      args.workflow_id,
      args.content,
      args.parent_id
    );

    const isReply = args.parent_id ? ' (reply)' : '';
    const lines = [
      `## Comment Added Successfully${isReply}`,
      '',
      `**Comment ID:** ${result.id}`,
      `**By:** ${result.user_name}`,
      `**Posted:** ${result.created_at}`,
      '',
      '> ' + result.content.split('\n').join('\n> '),
    ];

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
