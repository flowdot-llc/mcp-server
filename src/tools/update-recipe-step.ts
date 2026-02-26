/**
 * update_recipe_step MCP Tool
 *
 * Updates an existing step in a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { UpdateRecipeStepInput } from '../types.js';

export const updateRecipeStepTool: Tool = {
  name: 'update_recipe_step',
  description: "Update a step's name, description, config, or connections.",
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      step_id: {
        type: 'string',
        description: 'The step ID to update',
      },
      name: {
        type: 'string',
        description: 'New name for the step',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      config: {
        type: 'object',
        description: 'New configuration (merges with existing)',
        additionalProperties: true,
      },
      next: {
        type: 'string',
        description: 'New next step ID (use null to remove)',
      },
      on_error: {
        type: 'string',
        description: 'New error step ID (use null to remove)',
      },
      position: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
        description: 'New position on the visual canvas',
      },
    },
    required: ['hash', 'step_id'],
  },
};

export async function handleUpdateRecipeStep(
  api: FlowDotApiClient,
  args: {
    hash: string;
    step_id: string;
    name?: string;
    description?: string;
    config?: Record<string, unknown>;
    next?: string | null;
    on_error?: string | null;
    position?: { x: number; y: number };
  }
): Promise<CallToolResult> {
  try {
    const input: UpdateRecipeStepInput = {};
    if (args.name !== undefined) input.name = args.name;
    if (args.description !== undefined) input.description = args.description;
    if (args.config !== undefined) input.config = args.config;
    if (args.next !== undefined) input.next = args.next;
    if (args.on_error !== undefined) input.on_error = args.on_error;
    if (args.position !== undefined) input.position = args.position;

    const step = await api.updateRecipeStep(args.hash, args.step_id, input);

    return {
      content: [
        {
          type: 'text',
          text: `Step updated successfully!

**Name:** ${step.name}
**Type:** ${step.type}
**ID:** ${step.id}
**Next:** ${step.next || 'None'}
**On Error:** ${step.on_error || 'None'}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error updating step: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
