/**
 * list_recipe_versions MCP Tool
 *
 * Returns up to 20 most-recent rollback points for a recipe (newest first).
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listRecipeVersionsTool: Tool = {
  name: 'list_recipe_versions',
  description:
    'List recent version snapshots for a recipe (rollback history). Newest first, up to the retention limit (20). Each entry includes version_number, source (web/mcp/cli/voice/native/system), parent_kind (mutation/checkpoint/restore/initial), label, and timestamp. Use the version_number with get_recipe_version or restore_recipe_version.',
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

export async function handleListRecipeVersions(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const result = await api.listRecipeVersions(args.hash);

    if (!result.versions || result.versions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No versions recorded yet for recipe ${args.hash}. The first mutation will create v1.`,
          },
        ],
      };
    }

    const lines = result.versions.map((v) => {
      const author = v.created_by?.name ?? 'unknown';
      const label = v.label ? ` — ${v.label}` : '';
      const restoredFrom = v.restored_from_version_id
        ? ` (restored from v${v.restored_from_version_id})`
        : '';
      return `v${v.version_number} · ${v.parent_kind} · ${v.source} · ${author} · ${v.created_at}${label}${restoredFrom}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Versions for recipe ${result.recipe_hash} (retention ${result.retain}):\n\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing recipe versions: ${message}` }],
      isError: true,
    };
  }
}
