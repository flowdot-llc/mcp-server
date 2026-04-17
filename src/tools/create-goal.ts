import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { CreateGoalInput } from '../types.js';

export const createGoalTool: Tool = {
  name: 'create_goal',
  description: `Create a new persistent goal.

Goals are long-running objectives managed in the FlowDot Hub. After creating a goal you can:
- Add tasks (individual actions the daemon should execute)
- Add milestones (progress markers)
- Pause, resume, complete, or abandon the goal

**IMPORTANT**: Goals are executed by the FlowDot CLI daemon, not the MCP server. Use MCP to create and manage goal structure; use the CLI (\`flowdot goals trigger\`) or the native app to actually invoke/run the goal.`,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for the goal',
      },
      description: {
        type: 'string',
        description: 'Description of what this goal aims to accomplish',
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        default: 'medium',
        description: 'Goal priority',
      },
      allowed_actions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Allowed action types for tasks (e.g. research, draft, code, execute, recipe, loop, notify, toolkit)',
      },
    },
    required: ['name'],
  },
};

export async function handleCreateGoal(
  api: FlowDotApiClient,
  args: {
    name: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low';
    allowed_actions?: string[];
  }
): Promise<CallToolResult> {
  try {
    const input: CreateGoalInput = {
      name: args.name,
      description: args.description,
      priority: args.priority || 'medium',
      allowed_actions: args.allowed_actions,
    };

    const goal = await api.createGoal(input);

    return {
      content: [
        {
          type: 'text',
          text: `Goal created successfully!

**Name:** ${goal.name}
**Hash:** ${goal.hash}
**Status:** ${goal.status}
**Priority:** ${goal.priority}
**Description:** ${goal.description || 'None'}

Next steps:
- Add tasks with \`add_goal_task\`
- Add milestones with \`add_goal_milestone\`
- Run the goal via the CLI: \`flowdot goals trigger ${goal.hash}\``,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error creating goal: ${message}` }], isError: true };
  }
}
