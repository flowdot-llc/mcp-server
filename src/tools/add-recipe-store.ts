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

**Store Types:**
- **Input stores** (is_input: true): Values user provides when running
- **Output stores** (is_output: true): Values returned after execution
- **Internal stores**: Temporary values used during execution

**IMPORTANT - The \`request\` Convention:**
When users run a recipe with a task argument like:
\`flowdot my-recipe "do something"\`

The CLI passes this as \`inputs.request\`. Therefore:
- **Name your primary input store \`request\`** to receive the task directly
- In prompts, use \`{{inputs.request}}\` to access the CLI task argument
- Example: \`add_recipe_store(key: "request", is_input: true)\`

**Using Stores in Steps:**
Reference stores in agent prompts, conditions, and mappings with \`{{store_key}}\` syntax:
- Agent prompt: \`"Analyze {{topic}} and write to {{output}}"\`
- Branch condition: \`"{{severity}} === 'high'"\`
- Gate approval: \`"Review findings:\\n{{findings}}"\`

**Agent Output:**
Set \`output_store\` in agent config to write results to a store.`,
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
