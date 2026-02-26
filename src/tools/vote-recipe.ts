/**
 * vote_recipe MCP Tool
 *
 * Vote on a recipe (upvote, downvote, or remove vote).
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const voteRecipeTool: Tool = {
  name: 'vote_recipe',
  description: 'Vote on a recipe (upvote, downvote, or remove your vote). Only works on public recipes.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      vote: {
        type: 'string',
        enum: ['up', 'down', 'remove'],
        description: 'Vote action: "up" for upvote, "down" for downvote, "remove" to remove your vote',
      },
    },
    required: ['hash', 'vote'],
  },
};

export async function handleVoteRecipe(
  api: FlowDotApiClient,
  args: { hash: string; vote: 'up' | 'down' | 'remove' }
): Promise<CallToolResult> {
  try {
    const result = await api.voteRecipe(args.hash, args.vote);

    const voteEmoji = args.vote === 'up' ? '👍' : args.vote === 'down' ? '👎' : '🔄';
    const voteAction = args.vote === 'remove' ? 'removed' : `added ${args.vote}vote`;

    return {
      content: [
        {
          type: 'text',
          text: `${voteEmoji} Vote ${voteAction}!

**Recipe Score:** ${result.vote_count}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error voting: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
