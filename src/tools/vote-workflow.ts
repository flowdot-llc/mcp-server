/**
 * vote_workflow MCP Tool
 *
 * Votes on a workflow (upvote, downvote, or remove vote).
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const voteWorkflowTool: Tool = {
  name: 'vote_workflow',
  description: 'Vote on a workflow (upvote, downvote, or remove your vote). Only works on public workflows or your own workflows.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      vote: {
        type: 'string',
        enum: ['up', 'down', 'remove'],
        description: 'The vote action: "up" for upvote, "down" for downvote, "remove" to remove your vote',
      },
    },
    required: ['workflow_id', 'vote'],
  },
};

export async function handleVoteWorkflow(
  api: FlowDotApiClient,
  args: { workflow_id: string; vote: 'up' | 'down' | 'remove' }
): Promise<CallToolResult> {
  try {
    const result = await api.voteWorkflow(args.workflow_id, args.vote);

    const voteEmoji = args.vote === 'up' ? '👍' : args.vote === 'down' ? '👎' : '🗑️';
    const actionText = args.vote === 'remove' ? 'Vote removed' : `Voted ${args.vote}`;

    return {
      content: [{
        type: 'text',
        text: `${voteEmoji} ${actionText}\n\n**Workflow:** ${result.id}\n**New vote count:** ${result.vote_count}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error voting on workflow: ${message}` }],
      isError: true,
    };
  }
}
