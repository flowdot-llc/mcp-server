/**
 * create_input_preset MCP Tool
 *
 * Creates a new input preset (community input) for a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const createInputPresetTool: Tool = {
  name: 'create_input_preset',
  description: 'Create a new input preset (community input) for a workflow. This allows you to share pre-configured input values with others.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      title: {
        type: 'string',
        description: 'A descriptive title for the input preset',
      },
      description: {
        type: 'string',
        description: 'Optional description explaining the preset',
      },
      inputs: {
        type: 'object',
        description: 'The input values as a JSON object (keys are input names, values are the input values)',
      },
    },
    required: ['workflow_id', 'title', 'inputs'],
  },
};

export async function handleCreateInputPreset(
  api: FlowDotApiClient,
  args: {
    workflow_id: string;
    title: string;
    description?: string;
    inputs: Record<string, unknown>;
  }
): Promise<CallToolResult> {
  try {
    // Validate inputs
    if (!args.title || args.title.trim().length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: Title is required.' }],
        isError: true,
      };
    }

    if (!args.inputs || Object.keys(args.inputs).length === 0) {
      return {
        content: [{ type: 'text', text: 'Error: At least one input value is required.' }],
        isError: true,
      };
    }

    const result = await api.createInputPreset(args.workflow_id, {
      title: args.title,
      description: args.description,
      inputs: args.inputs,
    });

    const lines = [
      '## Input Preset Created Successfully',
      '',
      `**Hash:** ${result.hash}`,
      `**Title:** ${result.title}`,
      `**URL:** ${result.public_url}`,
      '',
      'Anyone can now use this preset to run the workflow with your pre-configured inputs.',
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
      content: [{ type: 'text', text: `Error creating input preset: ${message}` }],
      isError: true,
    };
  }
}
