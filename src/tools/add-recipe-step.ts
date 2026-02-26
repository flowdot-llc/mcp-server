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
  description: `Add a new step to a recipe. **Save the returned step ID** for connections.

**Step Types & Config:**

**agent** - LLM agent with tools
\`\`\`json
{ "user_prompt": "Instructions with {{inputs.request}} and {{store_key}}", "tools": ["read", "search", "web-search"], "output_store": "result_key", "max_iterations": 10 }
\`\`\`
**IMPORTANT:** Use \`user_prompt\` (NOT \`prompt\`) - this is the field the runtime expects.
Tools: read, search, analyze, find-definition, web-search, edit, execute-command, create-file

**parallel** - Run steps concurrently
\`\`\`json
{ "parallel_step_ids": ["step-id-1", "step-id-2"] }
\`\`\`

**loop** - Iterate over array
\`\`\`json
{ "items_store": "array_key", "item_store": "current_item_key", "body": "step-id-to-run" }
\`\`\`

**gate** - Approval or condition check
\`\`\`json
{ "requires_approval": true, "approval_prompt": "Review: {{data}}", "condition": "{{status}} === 'ready'" }
\`\`\`

**branch** - Conditional routing
\`\`\`json
{ "conditions": [{"expression": "{{x}} === 'a'", "then": "step-a"}], "default": "step-default" }
\`\`\`

**invoke** - Call another recipe
\`\`\`json
{ "recipe_hash": "xyz", "input_mapping": {"target_input": "{{source_store}}"}, "output_mapping": {"target_output": "local_store"} }
\`\`\`

**Interpolation Syntax:**
- \`{{inputs.request}}\` - Access CLI task argument (user runs: \`flowdot alias "task text"\`)
- \`{{store_key}}\` - Reference any store value by its key
- \`{{stores.store_key}}\` - Explicit store access (same as above)
- \`{{step.step_id}}\` - Access output from a previous step`,
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
- \`user_prompt\`: The prompt for the agent (REQUIRED - use this, NOT \`prompt\`)
- \`system_prompt\`: Optional system-level instructions
- \`model_tier\`: LLM model tier: "simple", "capable", or "complex" (optional)
- \`tools\`: Array of tool names to make available
- \`output_store\`: Store key to write agent output to
- \`max_iterations\`: Maximum iterations for the agent

**Interpolation in prompts:**
- Use \`{{inputs.request}}\` to access the CLI task argument
- Use \`{{store_key}}\` to reference store values`;
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
