/**
 * update_recipe_store MCP Tool
 *
 * Updates an existing store in a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { UpdateRecipeStoreInput } from '../types.js';

export const updateRecipeStoreTool: Tool = {
  name: 'update_recipe_store',
  description: "Update a store's key, label, type, default value, or input/output flags.",
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      store_id: {
        type: 'string',
        description: 'The store ID to update',
      },
      key: {
        type: 'string',
        description: 'New key for the store',
      },
      label: {
        type: 'string',
        description: 'New label',
      },
      schema_type: {
        type: 'string',
        enum: ['any', 'string', 'number', 'boolean', 'array', 'object'],
        description: 'New data type',
      },
      default_value: {
        description: 'New default value',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      is_input: {
        type: 'boolean',
        description: 'Mark as input store',
      },
      is_output: {
        type: 'boolean',
        description: 'Mark as output store',
      },
    },
    required: ['hash', 'store_id'],
  },
};

export async function handleUpdateRecipeStore(
  api: FlowDotApiClient,
  args: {
    hash: string;
    store_id: string;
    key?: string;
    label?: string;
    schema_type?: 'any' | 'string' | 'number' | 'boolean' | 'array' | 'object';
    default_value?: unknown;
    description?: string;
    is_input?: boolean;
    is_output?: boolean;
  }
): Promise<CallToolResult> {
  try {
    const input: UpdateRecipeStoreInput = {};
    if (args.key !== undefined) input.key = args.key;
    if (args.label !== undefined) input.label = args.label;
    if (args.schema_type !== undefined) input.schema_type = args.schema_type;
    if (args.default_value !== undefined) input.default_value = args.default_value;
    if (args.description !== undefined) input.description = args.description;
    if (args.is_input !== undefined) input.is_input = args.is_input;
    if (args.is_output !== undefined) input.is_output = args.is_output;

    const store = await api.updateRecipeStore(args.hash, args.store_id, input);

    const storeType = store.is_input ? 'Input' : store.is_output ? 'Output' : 'Internal';

    return {
      content: [
        {
          type: 'text',
          text: `Store updated successfully!

**Key:** ${store.key}
**Type:** ${storeType} (${store.schema_type})
**ID:** ${store.id}
**Default Value:** ${store.default_value !== undefined ? JSON.stringify(store.default_value) : 'None'}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error updating store: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
