import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listGoalsTool: Tool = {
  name: 'list_goals',
  description: 'List all goals for the authenticated user. Optionally filter by status.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['active', 'paused', 'completed', 'abandoned'],
        description: 'Filter goals by status',
      },
    },
    required: [],
  },
};

export async function handleListGoals(
  api: FlowDotApiClient,
  args: { status?: string }
): Promise<CallToolResult> {
  try {
    const goals = await api.listGoals(args.status);

    if (goals.length === 0) {
      return { content: [{ type: 'text', text: 'No goals found.' }] };
    }

    const lines = goals.map(
      (g) =>
        `**${g.name}** (${g.hash})\n  Status: ${g.status} | Priority: ${g.priority} | Tasks: ${g.completed_task_count}/${g.task_count} | Milestones: ${g.milestone_count}`
    );

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error listing goals: ${message}` }], isError: true };
  }
}
