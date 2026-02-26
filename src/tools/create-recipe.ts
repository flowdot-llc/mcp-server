/**
 * create_recipe MCP Tool
 *
 * Creates a new agent recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CreateRecipeInput } from '../types.js';

export const createRecipeTool: Tool = {
  name: 'create_recipe',
  description: `Create a new agent recipe. Recipes are reusable agent orchestration workflows.

**After Creating:**
1. Save the returned hash - you need it for all subsequent operations
2. Add input stores (is_input: true) - **name primary input \`request\`** for CLI task arg
3. Add output stores (is_output: true) - what recipe produces
4. Add steps and connect them via "next"
   - For agent steps: use \`user_prompt\` (NOT \`prompt\`) in config
   - Use \`{{inputs.request}}\` to access CLI task argument
5. Set entry_step_id with update_recipe
6. Link with alias for CLI access

**IMPORTANT**: Recipe won't run until entry_step_id is set!`,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for the recipe',
      },
      description: {
        type: 'string',
        description: 'Description of what the recipe does',
      },
      category: {
        type: 'string',
        description: 'Category for organizing the recipe',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for the recipe (max 10)',
      },
      visibility: {
        type: 'string',
        enum: ['private', 'public', 'unlisted'],
        default: 'private',
        description: 'Visibility setting',
      },
    },
    required: ['name'],
  },
};

export async function handleCreateRecipe(
  api: FlowDotApiClient,
  args: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    visibility?: 'private' | 'public' | 'unlisted';
  }
): Promise<CallToolResult> {
  try {
    const input: CreateRecipeInput = {
      name: args.name,
      description: args.description,
      category: args.category,
      tags: args.tags,
      visibility: args.visibility || 'private',
    };

    const result = await api.createRecipe(input);

    return {
      content: [
        {
          type: 'text',
          text: `Recipe created successfully!

**Name:** ${result.name}
**Hash:** ${result.hash}
**Description:** ${result.description || 'None'}

Next steps:
1. Add steps using \`add_recipe_step\`
2. Add stores using \`add_recipe_store\`
3. Configure the entry step`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error creating recipe: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
