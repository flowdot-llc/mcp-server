/**
 * add_recipe_store MCP Tool
 *
 * Adds a new store (variable) to a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CreateRecipeStoreInput } from '../types.js';

export const addRecipeStoreTool: Tool = {
  name: 'add_recipe_store',
  description: `Add a new store (variable) to a recipe. Stores hold data that flows between steps.

- **Input stores**: Values that must be provided when executing the recipe
- **Output stores**: Values that are returned after execution
- **Internal stores**: Temporary values used during execution`,
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      key: {
        type: 'string',
        description: 'Unique key for the store (used in expressions)',
      },
      label: {
        type: 'string',
        description: 'Human-readable label',
      },
      schema_type: {
        type: 'string',
        enum: ['any', 'string', 'number', 'boolean', 'array', 'object'],
        default: 'any',
        description: 'Data type of the store',
      },
      default_value: {
        description: 'Default value for the store',
      },
      description: {
        type: 'string',
        description: "Description of the store's purpose",
      },
      is_input: {
        type: 'boolean',
        default: false,
        description: 'If true, this is a required input when executing',
      },
      is_output: {
        type: 'boolean',
        default: false,
        description: 'If true, this value is returned after execution',
      },
    },
    required: ['hash', 'key'],
  },
};

export async function handleAddRecipeStore(
  api: FlowDotApiClient,
  args: {
    hash: string;
    key: string;
    label?: string;
    schema_type?: 'any' | 'string' | 'number' | 'boolean' | 'array' | 'object';
    default_value?: unknown;
    description?: string;
    is_input?: boolean;
    is_output?: boolean;
  }
): Promise<CallToolResult> {
  try {
    const input: CreateRecipeStoreInput = {
      key: args.key,
      label: args.label,
      schema_type: args.schema_type || 'any',
      default_value: args.default_value,
      description: args.description,
      is_input: args.is_input || false,
      is_output: args.is_output || false,
    };

    const store = await api.addRecipeStore(args.hash, input);

    const storeType = store.is_input ? 'Input' : store.is_output ? 'Output' : 'Internal';

    return {
      content: [
        {
          type: 'text',
          text: `Store added successfully!

**Key:** ${store.key}
**Type:** ${storeType} (${store.schema_type})
**ID:** ${store.id}
**Default Value:** ${store.default_value !== undefined ? JSON.stringify(store.default_value) : 'None'}

Use this store in expressions with: \`{{${store.key}}}\``,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error adding store: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
