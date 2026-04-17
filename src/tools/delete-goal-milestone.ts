import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const deleteGoalMilestoneTool: Tool = {
  name: 'delete_goal_milestone',
  description: 'Delete a milestone from a goal.',
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
      milestone_id: { type: 'number', description: 'The milestone ID' },
    },
    required: ['goal_hash', 'milestone_id'],
  },
};

export async function handleDeleteGoalMilestone(
  api: FlowDotApiClient,
  args: { goal_hash: string; milestone_id: number }
): Promise<CallToolResult> {
  try {
    await api.deleteGoalMilestone(args.goal_hash, args.milestone_id);
    return {
      content: [
        { type: 'text', text: `Milestone ${args.milestone_id} deleted from goal ${args.goal_hash}.` },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting milestone: ${message}` }],
      isError: true,
    };
  }
}
