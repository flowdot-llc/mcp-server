/**
 * checkpoint_recipe MCP Tool
 *
 * Creates an explicit version snapshot of the recipe's current state,
 * bypassing the 60-second coalescing window. Use before making a risky
 * batch of edits so you can roll back precisely to this point.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const checkpointRecipeTool: Tool = {
  name: 'checkpoint_recipe',
  description:
    'Create a manual checkpoint snapshot of a recipe. Unlike auto-snapshots (which coalesce within 60 seconds), a checkpoint is always recorded as its own version with parent_kind="checkpoint". Use before a multi-step rewrite so you can restore precisely to this point.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The recipe hash/ID' },
      label: {
        type: 'string',
        description: 'Optional human-readable label (max 200 chars) shown in version listings',
        maxLength: 200,
      },
    },
    required: ['hash'],
  },
};

export async function handleCheckpointRecipe(
  api: FlowDotApiClient,
  args: { hash: string; label?: string }
): Promise<CallToolResult> {
  try {
    const version = await api.checkpointRecipe(args.hash, args.label);

    return {
      content: [
        {
          type: 'text',
          text:
            `Checkpoint created for recipe ${args.hash} at v${version.version_number}` +
            (args.label ? ` — "${args.label}"` : '') +
            `\nUse \`restore_recipe_version\` with version_number=${version.version_number} to roll back here.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating checkpoint: ${message}` }],
      isError: true,
    };
  }
}
