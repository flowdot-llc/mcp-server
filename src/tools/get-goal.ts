import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getGoalTool: Tool = {
  name: 'get_goal',
  description: 'Get details for a specific goal by its hash.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'The goal hash',
      },
    },
    required: ['hash'],
  },
};

export async function handleGetGoal(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const goal = await api.getGoal(args.hash);

    return {
      content: [
        {
          type: 'text',
          text: `**${goal.name}** (${goal.hash})

**Status:** ${goal.status}
**Priority:** ${goal.priority}
**Description:** ${goal.description || 'None'}
**Tasks:** ${goal.completed_task_count}/${goal.task_count} completed
**Milestones:** ${goal.milestone_count}
**Allowed Actions:** ${goal.allowed_actions.length > 0 ? goal.allowed_actions.join(', ') : 'None specified'}
**Created:** ${goal.created_at}
**Updated:** ${goal.updated_at}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error getting goal: ${message}` }], isError: true };
  }
}
