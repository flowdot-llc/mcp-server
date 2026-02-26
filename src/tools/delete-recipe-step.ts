/**
 * delete_recipe_step MCP Tool
 *
 * Deletes a step from a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteRecipeStepTool: Tool = {
  name: 'delete_recipe_step',
  description: 'Delete a step from a recipe. References to this step will need to be updated.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      step_id: {
        type: 'string',
        description: 'The step ID to delete',
      },
      confirm: {
        type: 'boolean',
        description: 'Must be true to confirm deletion',
      },
    },
    required: ['hash', 'step_id', 'confirm'],
  },
};

export async function handleDeleteRecipeStep(
  api: FlowDotApiClient,
  args: { hash: string; step_id: string; confirm: boolean }
): Promise<CallToolResult> {
  try {
    if (!args.confirm) {
      return {
        content: [
          {
            type: 'text',
            text: 'Deletion cancelled. Set confirm to true to delete the step.',
          },
        ],
      };
    }

    await api.deleteRecipeStep(args.hash, args.step_id);

    return {
      content: [
        {
          type: 'text',
          text: `Step ${args.step_id} has been deleted from the recipe.

Note: Update any steps that referenced this step in their 'next' or 'on_error' fields.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting step: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
