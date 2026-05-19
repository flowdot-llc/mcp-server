/**
 * list_my_input_presets MCP Tool
 *
 * Lists every input preset owned by the authenticated user across all workflows.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { InputPreset } from '../types.js';

export const listMyInputPresetsTool: Tool = {
  name: 'list_my_input_presets',
  description: `List every input preset YOU have created across every workflow. Use this to inspect your personal preset library — including which presets are community-listed (is_community=true) and which are private to a workflow.

For presets on a specific workflow (yours or anyone's public one), use \`list_input_presets\` instead. For browsing community presets created by others, use \`browse_community_input_presets\`.`,
  inputSchema: {
    type: 'object',
    properties: {
      sort: {
        type: 'string',
        enum: ['newest', 'oldest', 'most_used', 'popular'],
        description: 'Sort order (default: newest)',
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

  lines.push(`**URL:** ${preset.public_url}`);
  lines.push(`**Votes:** ${preset.vote_count} | **Uses:** ${preset.usage_count}`);
  lines.push(`**Community-listed:** ${preset.is_community ? 'yes' : 'no'}`);

  if (preset.description) {
    lines.push(`**Description:** ${preset.description}`);
  }

  lines.push(`**Updated:** ${preset.updated_at}`);

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

export async function handleListMyInputPresets(
  api: FlowDotApiClient,
  args: { sort?: 'newest' | 'oldest' | 'most_used' | 'popular'; page?: number; per_page?: number }
): Promise<CallToolResult> {
  try {
    const result = await api.listMyInputPresets({
      sort: args.sort,
      page: args.page,
      per_page: args.per_page,
    });

    const presets = result.data || [];

    if (presets.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'You have not created any input presets yet.\n\nTip: Use `create_input_preset` on a workflow that has community inputs enabled. Set `is_community: true` to make it discoverable in /search.',
        }],
      };
    }

    const formatted = presets.map(formatPreset).join('\n\n---\n\n');
    const header = `## My Input Presets (${result.total} total, page ${result.current_page}/${result.last_page})\n\n`;

    return {
      content: [{ type: 'text', text: header + formatted }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing your input presets: ${message}` }],
      isError: true,
    };
  }
}
