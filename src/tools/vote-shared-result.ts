/**
 * vote_shared_result MCP Tool
 *
 * Votes on a shared execution result.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const voteSharedResultTool: Tool = {
  name: 'vote_shared_result',
  description: 'Vote on a shared execution result (upvote, downvote, or remove your vote).',
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
      vote: {
        type: 'string',
        enum: ['up', 'down', 'remove'],
        description: 'The vote action: "up" for upvote, "down" for downvote, "remove" to remove your vote',
      },
    },
    required: ['workflow_id', 'result_hash', 'vote'],
  },
};

export async function handleVoteSharedResult(
  api: FlowDotApiClient,
  args: { workflow_id: string; result_hash: string; vote: 'up' | 'down' | 'remove' }
): Promise<CallToolResult> {
  try {
    const result = await api.voteSharedResult(args.workflow_id, args.result_hash, args.vote);

    const voteEmoji = args.vote === 'up' ? '👍' : args.vote === 'down' ? '👎' : '🗑️';
    const actionText = args.vote === 'remove' ? 'Vote removed' : `Voted ${args.vote}`;

    return {
      content: [{
        type: 'text',
        text: `${voteEmoji} ${actionText}\n\n**Shared Result:** ${result.hash}\n**New vote count:** ${result.vote_count}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error voting on shared result: ${message}` }],
      isError: true,
    };
  }
}
