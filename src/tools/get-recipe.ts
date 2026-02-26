/**
 * get_recipe MCP Tool
 *
 * Gets detailed information about a specific agent recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getRecipeTool: Tool = {
  name: 'get_recipe',
  description:
    'Get detailed information about a specific agent recipe including its steps, stores, and metadata.',
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

export async function handleGetRecipe(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const recipe = await api.getRecipe(args.hash);

    // Format step types count
    const stepTypes: Record<string, number> = {};
    if (recipe.steps) {
      recipe.steps.forEach((s) => {
        stepTypes[s.type] = (stepTypes[s.type] || 0) + 1;
      });
    }
    const stepTypesStr = Object.entries(stepTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    // Format stores
    const inputStores = recipe.stores?.filter((s) => s.is_input) || [];
    const outputStores = recipe.stores?.filter((s) => s.is_output) || [];

    let storeInfo = '';
    if (inputStores.length > 0) {
      storeInfo += `\n\n**Input Stores (${inputStores.length}):**\n`;
      storeInfo += inputStores.map((s) => `- ${s.key}: ${s.schema_type}${s.description ? ` - ${s.description}` : ''}`).join('\n');
    }
    if (outputStores.length > 0) {
      storeInfo += `\n\n**Output Stores (${outputStores.length}):**\n`;
      storeInfo += outputStores.map((s) => `- ${s.key}: ${s.schema_type}${s.description ? ` - ${s.description}` : ''}`).join('\n');
    }

    // Format steps summary
    let stepsInfo = '';
    if (recipe.steps && recipe.steps.length > 0) {
      stepsInfo = `\n\n**Steps (${recipe.steps.length}):**\n`;
      stepsInfo += recipe.steps.map((s) => {
        const entryMark = s.id === recipe.entry_step_id ? ' [ENTRY]' : '';
        return `- ${s.name} (${s.type})${entryMark}${s.description ? `: ${s.description}` : ''}`;
      }).join('\n');
    }

    const visibility =
      recipe.visibility === 'public' ? 'Public' : recipe.visibility === 'unlisted' ? 'Unlisted' : 'Private';

    const text = `# ${recipe.name}

**Hash:** ${recipe.hash}
**Version:** ${recipe.version}
**Visibility:** ${visibility}
**Category:** ${recipe.category || 'None'}
**Tags:** ${recipe.tags?.length ? recipe.tags.join(', ') : 'None'}

**Description:** ${recipe.description || 'No description'}

**Step Types:** ${stepTypesStr || 'No steps'}${storeInfo}${stepsInfo}`;

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
          text: `Error getting recipe: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
