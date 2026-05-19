/**
 * browse_community_input_presets MCP Tool
 *
 * Browses community-flagged input presets across every workflow on the platform.
 * Symmetric counterpart to get_public_workflows — returns only presets the
 * author has opted in to community visibility (is_community=true).
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { InputPreset } from '../types.js';

export const browseCommunityInputPresetsTool: Tool = {
  name: 'browse_community_input_presets',
  description: `Browse community-shared input presets across ALL workflows on the platform. Returns only presets the author has opted in to community visibility (\`is_community=true\`). This is the preset equivalent of \`get_public_workflows\`.

To run one: read the preset's \`inputs\` payload, then call \`execute_workflow\` against the preset's parent workflow with those inputs. The parent workflow hash is returned with each result.`,
  inputSchema: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Search term — matched against preset title and description (LIKE)',
      },
      author: {
        type: 'string',
        description: 'Filter to presets created by an author whose name matches (LIKE)',
      },
      sort: {
        type: 'string',
        enum: ['popular', 'newest', 'oldest', 'most_used'],
        description: 'Sort order (default: popular)',
      },
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
      },
      per_page: {
        type: 'number',
        description: 'Results per page (default: 20, max: 50)',
      },
    },
  },
};

function formatPreset(preset: InputPreset): string {
  const lines = [
    `### ${preset.title} (${preset.hash})`,
    '',
  ];

  if (preset.workflow) {
    lines.push(`**Workflow:** ${preset.workflow.name} (${preset.workflow.hash})`);
  }

  if (preset.user) {
    lines.push(`**Author:** ${preset.user.name}`);
  }

  lines.push(`**URL:** ${preset.public_url}`);
  lines.push(`**Votes:** ${preset.vote_count} | **Uses:** ${preset.usage_count}`);

  if (preset.description) {
    lines.push(`**Description:** ${preset.description}`);
  }

  lines.push(`**Created:** ${preset.created_at}`);

  if (preset.inputs && Object.keys(preset.inputs).length > 0) {
    lines.push('', '**Inputs:**');
    for (const [key, value] of Object.entries(preset.inputs)) {
      const stringified = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const summary = stringified.length > 100 ? stringified.substring(0, 100) + '...' : stringified;
      lines.push(`- **${key}:** ${summary}`);
    }
  }

  return lines.join('\n');
}

export async function handleBrowseCommunityInputPresets(
  api: FlowDotApiClient,
  args: {
    q?: string;
    author?: string;
    sort?: 'popular' | 'newest' | 'oldest' | 'most_used';
    page?: number;
    per_page?: number;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.browseCommunityInputPresets({
      q: args.q,
      author: args.author,
      sort: args.sort,
      page: args.page,
      per_page: args.per_page,
    });

    const presets = result.data || [];

    if (presets.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No community-shared input presets matched.\n\nTip: omit `q` and `author` filters to browse top community presets, or call `get_public_workflows` first to find workflows that have community inputs enabled.',
        }],
      };
    }

    const formatted = presets.map(formatPreset).join('\n\n---\n\n');
    const header = `## Community Input Presets (${result.total} total, page ${result.current_page}/${result.last_page})\n\n`;

    return {
      content: [{ type: 'text', text: header + formatted }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error browsing community input presets: ${message}` }],
      isError: true,
    };
  }
}
