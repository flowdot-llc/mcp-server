/**
 * delete_recipe MCP Tool
 *
 * Permanently deletes an agent recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteRecipeTool: Tool = {
  name: 'delete_recipe',
  description: 'Permanently delete an agent recipe. This action cannot be undone.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID to delete',
      },
      confirm: {
        type: 'boolean',
        description: 'Must be true to confirm deletion',
      },
    },
    required: ['hash', 'confirm'],
  },
};

export async function handleDeleteRecipe(
  api: FlowDotApiClient,
  args: { hash: string; confirm: boolean }
): Promise<CallToolResult> {
  try {
    if (!args.confirm) {
      return {
        content: [
          {
            type: 'text',
            text: 'Deletion cancelled. Set confirm to true to delete the recipe.',
          },
        ],
      };
    }

    await api.deleteRecipe(args.hash);

    return {
      content: [
        {
          type: 'text',
          text: `Recipe ${args.hash} has been permanently deleted.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting recipe: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
