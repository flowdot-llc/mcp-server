/**
 * get_input_preset MCP Tool
 *
 * Gets details of a specific input preset.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getInputPresetTool: Tool = {
  name: 'get_input_preset',
  description: 'Get detailed information about a specific input preset (community input), including all input values.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      preset_hash: {
        type: 'string',
        description: 'The input preset hash',
      },
    },
    required: ['workflow_id', 'preset_hash'],
  },
};

export async function handleGetInputPreset(
  api: FlowDotApiClient,
  args: { workflow_id: string; preset_hash: string }
): Promise<CallToolResult> {
  try {
    const preset = await api.getInputPreset(args.workflow_id, args.preset_hash);

    const lines = [
      `## ${preset.title}`,
      '',
      `**Hash:** ${preset.hash}`,
      `**URL:** ${preset.public_url}`,
      `**Votes:** ${preset.vote_count} | **Uses:** ${preset.usage_count}`,
    ];

    if (preset.description) {
      lines.push('', `**Description:** ${preset.description}`);
    }

    if (preset.workflow) {
      lines.push('', '### Workflow');
      lines.push(`- **Name:** ${preset.workflow.name}`);
      lines.push(`- **Hash:** ${preset.workflow.hash}`);
    }

    if (preset.user) {
      lines.push('', `**Created by:** ${preset.user.name} (${preset.user.hash})`);
    }

    lines.push(`**Created:** ${preset.created_at}`);
    lines.push(`**Updated:** ${preset.updated_at}`);

    if (preset.can_edit) {
      lines.push('', '> You can edit this preset.');
    }

    // Show all input values
    if (preset.inputs && Object.keys(preset.inputs).length > 0) {
      lines.push('', '### Input Values');
      lines.push('```json');
      lines.push(JSON.stringify(preset.inputs, null, 2));
      lines.push('```');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting input preset: ${message}` }],
      isError: true,
    };
  }
}
