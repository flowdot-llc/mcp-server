/**
 * update_input_preset MCP Tool
 *
 * Updates an existing input preset.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const updateInputPresetTool: Tool = {
  name: 'update_input_preset',
  description: 'Update an existing input preset. You can only update presets you created.',
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
      title: {
        type: 'string',
        description: 'Updated title (optional)',
      },
      description: {
        type: 'string',
        description: 'Updated description (optional)',
      },
      inputs: {
        type: 'object',
        description: 'Updated input values (optional)',
      },
    },
    required: ['workflow_id', 'preset_hash'],
  },
};

export async function handleUpdateInputPreset(
  api: FlowDotApiClient,
  args: {
    workflow_id: string;
    preset_hash: string;
    title?: string;
    description?: string;
    inputs?: Record<string, unknown>;
  }
): Promise<CallToolResult> {
  try {
    // Build update object
    const updates: { title?: string; description?: string; inputs?: Record<string, unknown> } = {};

    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.inputs !== undefined) {
      updates.inputs = args.inputs;
    }

    if (Object.keys(updates).length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: No updates provided. Specify at least one field to update (title, description, or inputs).' }],
        isError: true,
      };
    }

    const result = await api.updateInputPreset(args.workflow_id, args.preset_hash, updates);

    const lines = [
      '## Input Preset Updated Successfully',
      '',
      `**Hash:** ${result.hash}`,
      `**Title:** ${result.title}`,
      `**URL:** ${result.public_url}`,
      `**Updated:** ${result.updated_at}`,
    ];

    if (result.description) {
      lines.push(`**Description:** ${result.description}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating input preset: ${message}` }],
      isError: true,
    };
  }
}
