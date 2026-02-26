/**
 * fork_recipe MCP Tool
 *
 * Creates a copy of a public recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const forkRecipeTool: Tool = {
  name: 'fork_recipe',
  description: 'Create a copy of a public recipe into your account. The copy will be private and editable.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID to fork',
      },
      name: {
        type: 'string',
        description: 'Optional new name for the forked recipe',
      },
    },
    required: ['hash'],
  },
};

export async function handleForkRecipe(
  api: FlowDotApiClient,
  args: { hash: string; name?: string }
): Promise<CallToolResult> {
  try {
    const result = await api.forkRecipe(args.hash, args.name);

    return {
      content: [
        {
          type: 'text',
          text: `Recipe forked successfully!

**New Name:** ${result.name}
**New Hash:** ${result.hash}
**Forked From:** ${result.forked_from.name} by ${result.forked_from.user_name}
**Visibility:** Private

You can now edit this recipe and customize it for your needs.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error forking recipe: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
