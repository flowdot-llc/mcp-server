/**
 * vote_input_preset MCP Tool
 *
 * Votes on an input preset.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const voteInputPresetTool: Tool = {
  name: 'vote_input_preset',
  description: 'Vote on an input preset (upvote, downvote, or remove your vote).',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      preset_hash: {
        type: 'string',
        description: 'The input preset hash',
      },
      vote: {
        type: 'string',
        enum: ['up', 'down', 'remove'],
        description: 'The vote action: "up" for upvote, "down" for downvote, "remove" to remove your vote',
      },
    },
    required: ['workflow_id', 'preset_hash', 'vote'],
  },
};

export async function handleVoteInputPreset(
  api: FlowDotApiClient,
  args: { workflow_id: string; preset_hash: string; vote: 'up' | 'down' | 'remove' }
): Promise<CallToolResult> {
  try {
    const result = await api.voteInputPreset(args.workflow_id, args.preset_hash, args.vote);

    const voteEmoji = args.vote === 'up' ? '👍' : args.vote === 'down' ? '👎' : '🗑️';
    const actionText = args.vote === 'remove' ? 'Vote removed' : `Voted ${args.vote}`;

    return {
      content: [{
        type: 'text',
        text: `${voteEmoji} ${actionText}\n\n**Input Preset:** ${result.hash}\n**New vote count:** ${result.vote_count}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error voting on input preset: ${message}` }],
      isError: true,
    };
  }
}
