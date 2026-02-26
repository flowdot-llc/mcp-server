/**
 * list_recipe_stores MCP Tool
 *
 * Lists all stores in a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listRecipeStoresTool: Tool = {
  name: 'list_recipe_stores',
  description:
    'List all stores (variables) in a recipe. Stores hold data that flows between steps.',
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

export async function handleListRecipeStores(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const stores = await api.listRecipeStores(args.hash);

    if (stores.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No stores found in this recipe. Use `add_recipe_store` to add stores.',
          },
        ],
      };
    }

    const inputStores = stores.filter((s) => s.is_input);
    const outputStores = stores.filter((s) => s.is_output);
    const internalStores = stores.filter((s) => !s.is_input && !s.is_output);

    let text = `Recipe Stores (${stores.length} total):\n`;

    if (inputStores.length > 0) {
      text += `\n**Input Stores (${inputStores.length}):**\n`;
      text += inputStores
        .map((s) => {
          const defaultVal = s.default_value !== undefined && s.default_value !== null
            ? ` = ${JSON.stringify(s.default_value)}`
            : '';
          return `- **${s.key}** (${s.schema_type})${defaultVal}${s.description ? ` - ${s.description}` : ''}\n    ID: ${s.id}`;
        })
        .join('\n');
    }

    if (outputStores.length > 0) {
      text += `\n\n**Output Stores (${outputStores.length}):**\n`;
      text += outputStores
        .map((s) => `- **${s.key}** (${s.schema_type})${s.description ? ` - ${s.description}` : ''}\n    ID: ${s.id}`)
        .join('\n');
    }

    if (internalStores.length > 0) {
      text += `\n\n**Internal Stores (${internalStores.length}):**\n`;
      text += internalStores
        .map((s) => {
          const defaultVal = s.default_value !== undefined && s.default_value !== null
            ? ` = ${JSON.stringify(s.default_value)}`
            : '';
          return `- **${s.key}** (${s.schema_type})${defaultVal}${s.description ? ` - ${s.description}` : ''}\n    ID: ${s.id}`;
        })
        .join('\n');
    }

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error listing stores: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
