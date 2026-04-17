import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listGoalMilestonesTool: Tool = {
  name: 'list_goal_milestones',
  description: 'List all milestones for a goal.',
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
    },
    required: ['goal_hash'],
  },
};

export async function handleListGoalMilestones(
  api: FlowDotApiClient,
  args: { goal_hash: string }
): Promise<CallToolResult> {
  try {
    const milestones = await api.listGoalMilestones(args.goal_hash);

    if (milestones.length === 0) {
      return { content: [{ type: 'text', text: 'No milestones found for this goal.' }] };
    }

    const lines = milestones.map(
      (m) =>
        `**[${m.id}]** ${m.title}\n  Status: ${m.status} | Progress: ${m.progress}%${m.target_date ? ` | Target: ${m.target_date}` : ''}`
    );

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing goal milestones: ${message}` }],
      isError: true,
    };
  }
}
