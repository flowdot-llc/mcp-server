/**
 * delete_recipe_store MCP Tool
 *
 * Deletes a store from a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteRecipeStoreTool: Tool = {
  name: 'delete_recipe_store',
  description: 'Delete a store from a recipe. Steps using this store will need to be updated.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      store_id: {
        type: 'string',
        description: 'The store ID to delete',
      },
      confirm: {
        type: 'boolean',
        description: 'Must be true to confirm deletion',
      },
    },
    required: ['hash', 'store_id', 'confirm'],
  },
};

export async function handleDeleteRecipeStore(
  api: FlowDotApiClient,
  args: { hash: string; store_id: string; confirm: boolean }
): Promise<CallToolResult> {
  try {
    if (!args.confirm) {
      return {
        content: [
          {
            type: 'text',
            text: 'Deletion cancelled. Set confirm to true to delete the store.',
          },
        ],
      };
    }

    await api.deleteRecipeStore(args.hash, args.store_id);

    return {
      content: [
        {
          type: 'text',
          text: `Store ${args.store_id} has been deleted from the recipe.

Note: Update any steps that referenced this store in their configurations.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting store: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
