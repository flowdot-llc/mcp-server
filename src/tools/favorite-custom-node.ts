/**
 * favorite_custom_node MCP Tool
 *
 * Add or remove a custom node from favorites.
 * Scope: custom_nodes:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const favoriteCustomNodeTool: Tool = {
  name: 'favorite_custom_node',
  description: 'Add or remove a custom node from your favorites.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash)',
      },
      favorite: {
        type: 'boolean',
        description: 'true to add to favorites, false to remove. If not specified, toggles the current state.',
      },
    },
    required: ['node_id'],
  },
};

export async function handleFavoriteCustomNode(
  api: FlowDotApiClient,
  args: { node_id: string; favorite?: boolean }
): Promise<CallToolResult> {
  try {
    // If favorite is not specified, default to true (add to favorites)
    const favorite = args.favorite !== undefined ? args.favorite : true;

    const result = await api.favoriteCustomNode(args.node_id, favorite);

    const lines = [
      `## Favorite Updated`,
      ``,
      `**Node ID:** ${result.id}`,
      `**Status:** ${result.is_favorited ? 'Added to favorites' : 'Removed from favorites'}`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating favorite: ${message}` }],
      isError: true,
    };
  }
}
