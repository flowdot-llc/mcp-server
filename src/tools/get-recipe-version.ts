/**
 * get_recipe_version MCP Tool
 *
 * Returns the full snapshotted definition of one historical version.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getRecipeVersionTool: Tool = {
  name: 'get_recipe_version',
  description:
    'Fetch the complete definition snapshot of one recipe version. Use this to inspect a prior state before deciding whether to restore_recipe_version. The returned definition matches the shape of get_recipe_definition (steps, stores, entry_step_id, etc.).',
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The recipe hash/ID' },
      version_number: {
        type: 'integer',
        description: 'The version_number to inspect (from list_recipe_versions)',
        minimum: 1,
      },
    },
    required: ['hash', 'version_number'],
  },
};

export async function handleGetRecipeVersion(
  api: FlowDotApiClient,
  args: { hash: string; version_number: number }
): Promise<CallToolResult> {
  try {
    const version = await api.getRecipeVersion(args.hash, args.version_number);

    return {
      content: [
        {
          type: 'text',
          text:
            `Recipe ${args.hash} — v${version.version_number} (${version.parent_kind}, source=${version.source})\n` +
            `Created: ${version.created_at} by ${version.created_by?.name ?? 'unknown'}\n` +
            (version.label ? `Label: ${version.label}\n` : '') +
            `Definition size: ${version.definition_size_bytes} bytes\n\n` +
            `Definition:\n${JSON.stringify(version.definition, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error fetching recipe version: ${message}` }],
      isError: true,
    };
  }
}
