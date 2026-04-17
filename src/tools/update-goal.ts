import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { UpdateGoalInput } from '../types.js';

export const updateGoalTool: Tool = {
  name: 'update_goal',
  description: 'Update a goal\'s name, description, priority, or allowed actions.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The goal hash',
      },
      name: {
        type: 'string',
        description: 'New name for the goal',
      },
      description: {
        type: 'string',
        description: 'New description',
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'New priority',
      },
      allowed_actions: {
        type: 'array',
        items: { type: 'string' },
        description: 'New list of allowed action types',
      },
    },
    required: ['hash'],
  },
};

export async function handleUpdateGoal(
  api: FlowDotApiClient,
  args: {
    hash: string;
    name?: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low';
    allowed_actions?: string[];
  }
): Promise<CallToolResult> {
  try {
    const input: UpdateGoalInput = {
      name: args.name,
      description: args.description,
      priority: args.priority,
      allowed_actions: args.allowed_actions,
    };

    const goal = await api.updateGoal(args.hash, input);

    return {
      content: [
        {
          type: 'text',
          text: `Goal updated successfully!\n\n**Name:** ${goal.name}\n**Hash:** ${goal.hash}\n**Priority:** ${goal.priority}\n**Status:** ${goal.status}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error updating goal: ${message}` }], isError: true };
  }
}
