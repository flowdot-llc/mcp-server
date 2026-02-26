/**
 * update_recipe MCP Tool
 *
 * Updates an existing agent recipe's metadata.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { UpdateRecipeInput } from '../types.js';

export const updateRecipeTool: Tool = {
  name: 'update_recipe',
  description: `Update an agent recipe's metadata, including the critical entry_step_id.

**CRITICAL - entry_step_id:**
Recipe will NOT run until entry_step_id is set to a valid step ID!
After adding steps, you MUST call this tool with entry_step_id pointing to the first step.

**Example:**
\`\`\`
update_recipe({ hash: "abc", entry_step_id: "first-step-uuid" })
\`\`\``,
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID to update',
      },
      name: {
        type: 'string',
        description: 'New name for the recipe',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      category: {
        type: 'string',
        description: 'New category',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'New tags (replaces existing)',
      },
      visibility: {
        type: 'string',
        enum: ['private', 'public', 'unlisted'],
        description: 'New visibility setting',
      },
      entry_step_id: {
        type: 'string',
        description: 'Set the entry step ID',
      },
    },
    required: ['hash'],
  },
};

export async function handleUpdateRecipe(
  api: FlowDotApiClient,
  args: {
    hash: string;
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    visibility?: 'private' | 'public' | 'unlisted';
    entry_step_id?: string;
  }
): Promise<CallToolResult> {
  try {
    const input: UpdateRecipeInput = {};
    if (args.name !== undefined) input.name = args.name;
    if (args.description !== undefined) input.description = args.description;
    if (args.category !== undefined) input.category = args.category;
    if (args.tags !== undefined) input.tags = args.tags;
    if (args.visibility !== undefined) input.visibility = args.visibility;
    if (args.entry_step_id !== undefined) input.entry_step_id = args.entry_step_id;

    const recipe = await api.updateRecipe(args.hash, input);

    return {
      content: [
        {
          type: 'text',
          text: `Recipe updated successfully!

**Name:** ${recipe.name}
**Hash:** ${recipe.hash}
**Visibility:** ${recipe.visibility}
**Entry Step:** ${recipe.entry_step_id || 'Not set'}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error updating recipe: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
