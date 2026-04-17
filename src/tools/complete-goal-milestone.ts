import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const completeGoalMilestoneTool: Tool = {
  name: 'complete_goal_milestone',
  description: 'Mark a goal milestone as completed.',
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
      milestone_id: { type: 'number', description: 'The milestone ID' },
    },
    required: ['goal_hash', 'milestone_id'],
  },
};

export async function handleCompleteGoalMilestone(
  api: FlowDotApiClient,
  args: { goal_hash: string; milestone_id: number }
): Promise<CallToolResult> {
  try {
    const milestone = await api.completeGoalMilestone(args.goal_hash, args.milestone_id);
    return {
      content: [
        {
          type: 'text',
          text: `Milestone "${milestone.title}" marked as completed. Status: ${milestone.status}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error completing milestone: ${message}` }],
      isError: true,
    };
  }
}
