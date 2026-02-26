/**
 * add_recipe_step MCP Tool
 *
 * Adds a new step to a recipe.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CreateRecipeStepInput, RecipeStepType } from '../types.js';

export const addRecipeStepTool: Tool = {
  name: 'add_recipe_step',
  description: `Add a new step to a recipe. Step types:
- **agent**: Run an LLM agent with prompts and tools
- **loop**: Iterate over items in a store
- **parallel**: Run multiple steps concurrently
- **gate**: Conditional check or approval gate
- **branch**: Conditional branching based on expressions
- **invoke**: Run another recipe as a subroutine`,
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The recipe hash/ID',
      },
      name: {
        type: 'string',
        description: 'Name for the step',
      },
      type: {
        type: 'string',
        enum: ['agent', 'loop', 'parallel', 'gate', 'branch', 'invoke'],
        description: 'Step type',
      },
      description: {
        type: 'string',
        description: 'Description of what the step does',
      },
      config: {
        type: 'object',
        description: 'Step-specific configuration. Varies by type.',
        additionalProperties: true,
      },
      next: {
        type: 'string',
        description: 'ID of the next step to run on success',
      },
      on_error: {
        type: 'string',
        description: 'ID of the step to run on error',
      },
      position: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
        },
        description: 'Position on the visual canvas',
      },
    },
    required: ['hash', 'name', 'type'],
  },
};

export async function handleAddRecipeStep(
  api: FlowDotApiClient,
  args: {
    hash: string;
    name: string;
    type: RecipeStepType;
    description?: string;
    config?: Record<string, unknown>;
    next?: string;
    on_error?: string;
    position?: { x: number; y: number };
  }
): Promise<CallToolResult> {
  try {
    const input: CreateRecipeStepInput = {
      name: args.name,
      type: args.type,
      description: args.description,
      config: args.config || {},
      next: args.next,
      on_error: args.on_error,
      position: args.position,
    };

    const step = await api.addRecipeStep(args.hash, input);

    let configInfo = '';
    if (args.type === 'agent') {
      configInfo = `

**Agent Configuration:**
Set the config object with:
- \`prompt\`: The system/user prompt for the agent
- \`model\`: LLM model to use (optional)
- \`tools\`: Array of tool names to make available
- \`max_iterations\`: Maximum iterations for the agent`;
    } else if (args.type === 'loop') {
      configInfo = `

**Loop Configuration:**
Set the config object with:
- \`items_store\`: Store key containing the array to iterate over
- \`item_store\`: Store key to put each item in
- \`body\`: Step ID to run for each iteration`;
    } else if (args.type === 'branch') {
      configInfo = `

**Branch Configuration:**
Set the config object with:
- \`conditions\`: Array of { expression, then } objects
- \`default\`: Step ID if no conditions match`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Step added successfully!

**Name:** ${step.name}
**Type:** ${step.type}
**ID:** ${step.id}
**Next:** ${step.next || 'None'}
**On Error:** ${step.on_error || 'None'}${configInfo}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error adding step: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
