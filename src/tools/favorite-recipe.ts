/**
 * favorite_recipe MCP Tool
 *
 * Add or remove a recipe from favorites.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const favoriteRecipeTool: Tool = {
  name: 'favorite_recipe',
  description: 'Add or remove a recipe from your favorites. Favorited recipes can be filtered in list_recipes.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      favorite: {
        type: 'boolean',
        description: 'Set to true to add to favorites, false to remove',
      },
    },
    required: ['hash', 'favorite'],
  },
};

export async function handleFavoriteRecipe(
  api: FlowDotApiClient,
  args: { hash: string; favorite: boolean }
): Promise<CallToolResult> {
  try {
    const result = await api.favoriteRecipe(args.hash, args.favorite);

    const emoji = args.favorite ? '⭐' : '✓';
    const action = args.favorite ? 'added to' : 'removed from';

    return {
      content: [
        {
          type: 'text',
          text: `${emoji} Recipe ${action} favorites!

**Favorited:** ${result.is_favorited ? 'Yes' : 'No'}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error updating favorite: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
