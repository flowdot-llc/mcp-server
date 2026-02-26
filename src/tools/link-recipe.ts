/**
 * link_recipe MCP Tool
 *
 * Links a recipe for use in MCP context.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { LinkRecipeInput } from '../types.js';

export const linkRecipeTool: Tool = {
  name: 'link_recipe',
  description:
    'Link a recipe for quick access via an alias. Linked recipes can be executed using their alias.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID to link',
      },
      alias: {
        type: 'string',
        description: 'A friendly alias for the recipe (e.g., "code-reviewer", "summarizer")',
      },
      is_default: {
        type: 'boolean',
        description: 'Whether this should be the default linked recipe',
        default: false,
      },
    },
    required: ['hash', 'alias'],
  },
};

export async function handleLinkRecipe(
  api: FlowDotApiClient,
  args: { hash: string; alias: string; is_default?: boolean }
): Promise<CallToolResult> {
  try {
    const input: LinkRecipeInput = {
      alias: args.alias,
      is_default: args.is_default,
    };

    const result = await api.linkRecipe(args.hash, input);

    return {
      content: [
        {
          type: 'text',
          text: `Recipe linked successfully!

**Alias:** ${result.alias}
**Recipe:** ${result.recipe_name} (${result.recipe_hash})
**Default:** ${result.is_default ? 'Yes' : 'No'}

You can now execute this recipe using the alias.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error linking recipe: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
