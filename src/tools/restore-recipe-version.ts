/**
 * restore_recipe_version MCP Tool
 *
 * Rolls a recipe back to a prior version's state. Before applying the
 * snapshot the service captures the CURRENT state as a new version, so
 * the restore itself is reversible (run restore_recipe_version again
 * targeting that pre-restore version to undo the rollback).
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const restoreRecipeVersionTool: Tool = {
  name: 'restore_recipe_version',
  description:
    "Restore a recipe to one of its prior versions. The current state is automatically snapshotted before the restore applies, so this action is reversible — call restore_recipe_version again on the 'pre-restore' version to undo it. Requires explicit confirm=true.",
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The recipe hash/ID' },
      version_number: {
        type: 'integer',
        description: 'The version_number to restore (from list_recipe_versions)',
        minimum: 1,
      },
      confirm: {
        type: 'boolean',
        description: 'Must be true to confirm the rollback',
        const: true,
      },
    },
    required: ['hash', 'version_number', 'confirm'],
  },
};

export async function handleRestoreRecipeVersion(
  api: FlowDotApiClient,
  args: { hash: string; version_number: number; confirm: boolean }
): Promise<CallToolResult> {
  if (args.confirm !== true) {
    return {
      content: [
        {
          type: 'text',
          text: 'Restore not performed: confirm must be true to apply the rollback.',
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await api.restoreRecipeVersion(args.hash, args.version_number);

    return {
      content: [
        {
          type: 'text',
          text:
            `Recipe ${args.hash} restored to v${result.restored_to}.\n` +
            `New head version: v${result.new_head_version}\n` +
            `Pre-restore snapshot: v${result.pre_restore_version} (use this version_number to undo the restore).`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error restoring recipe version: ${message}` }],
      isError: true,
    };
  }
}
