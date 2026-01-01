/**
 * vote_custom_node MCP Tool
 *
 * Vote on a custom node (upvote, downvote, or remove vote).
 * Scope: custom_nodes:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const voteCustomNodeTool: Tool = {
  name: 'vote_custom_node',
  description: 'Vote on a custom node. You can upvote, downvote, or remove your vote.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash)',
      },
      vote: {
        type: 'string',
        enum: ['up', 'down', 'remove'],
        description: 'Vote action: "up" for upvote, "down" for downvote, "remove" to remove your vote',
      },
    },
    required: ['node_id', 'vote'],
  },
};

export async function handleVoteCustomNode(
  api: FlowDotApiClient,
  args: { node_id: string; vote: 'up' | 'down' | 'remove' }
): Promise<CallToolResult> {
  try {
    const result = await api.voteCustomNode(args.node_id, args.vote);

    let action: string;
    switch (args.vote) {
      case 'up':
        action = 'upvoted';
        break;
      case 'down':
        action = 'downvoted';
        break;
      case 'remove':
        action = 'vote removed from';
        break;
    }

    const lines = [
      `## Vote Recorded`,
      ``,
      `**Node ID:** ${result.id}`,
      `**Action:** ${action}`,
      `**New Vote Count:** ${result.vote_count}`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error voting on custom node: ${message}` }],
      isError: true,
    };
  }
}
