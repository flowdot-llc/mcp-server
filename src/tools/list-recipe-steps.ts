/**
 * list_recipe_steps MCP Tool
 *
 * Lists all steps in a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listRecipeStepsTool: Tool = {
  name: 'list_recipe_steps',
  description: 'List all steps in a recipe with their types, connections, and configurations.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
    },
    required: ['hash'],
  },
};

export async function handleListRecipeSteps(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const steps = await api.listRecipeSteps(args.hash);

    if (steps.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No steps found in this recipe. Use `add_recipe_step` to add steps.',
          },
        ],
      };
    }

    // Get recipe to check entry step
    const recipe = await api.getRecipe(args.hash);
    const entryStepId = recipe.entry_step_id;

    const stepList = steps
      .map((s) => {
        const isEntry = s.id === entryStepId;
        const entryMark = isEntry ? ' **[ENTRY]**' : '';
        const desc = s.description ? ` - ${s.description}` : '';
        const next = s.next ? `\n    → next: ${s.next}` : '';
        const onError = s.on_error ? `\n    → on_error: ${s.on_error}` : '';
        return `- **${s.name}** (${s.type})${entryMark}${desc}${next}${onError}
    ID: ${s.id}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Recipe Steps (${steps.length}):\n\n${stepList}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error listing steps: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
