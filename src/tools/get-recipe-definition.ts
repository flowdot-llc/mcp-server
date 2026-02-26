/**
 * get_recipe_definition MCP Tool
 *
 * Gets the complete recipe definition in YAML format for export or inspection.
 * This is the canonical format for recipe definitions - both MCP and CLI
 * should return identical YAML output for validation purposes.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import yaml from 'js-yaml';

export const getRecipeDefinitionTool: Tool = {
  name: 'get_recipe_definition',
  description:
    'Get the complete recipe definition in YAML format. Returns all steps, stores, entry_step_id, and configuration details. Use this to inspect or validate recipe definitions.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      format: {
        type: 'string',
        enum: ['yaml', 'json'],
        description: 'Output format: yaml (default) or json',
      },
    },
    required: ['hash'],
  },
};

export async function handleGetRecipeDefinition(
  api: FlowDotApiClient,
  args: { hash: string; format?: 'yaml' | 'json' }
): Promise<CallToolResult> {
  try {
    const definition = await api.getRecipeDefinition(args.hash);
    const format = args.format || 'yaml';

    let text: string;
    let codeBlock: string;

    if (format === 'json') {
      text = JSON.stringify(definition, null, 2);
      codeBlock = 'json';
    } else {
      // YAML output - canonical format for recipe definitions
      text = yaml.dump(definition, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false, // Preserve field order
      });
      codeBlock = 'yaml';
    }

    return {
      content: [
        {
          type: 'text',
          text: `Recipe Definition for ${args.hash}:\n\n\`\`\`${codeBlock}\n${text}\`\`\``,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error getting recipe definition: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
