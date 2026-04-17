import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listGoalTasksTool: Tool = {
  name: 'list_goal_tasks',
  description: 'List all tasks for a goal. Optionally filter by status.',
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
      status: {
        type: 'string',
        description: 'Filter tasks by status (e.g. pending, completed, failed)',
      },
    },
    required: ['goal_hash'],
  },
};

export async function handleListGoalTasks(
  api: FlowDotApiClient,
  args: { goal_hash: string; status?: string }
): Promise<CallToolResult> {
  try {
    const tasks = await api.listGoalTasks(args.goal_hash, args.status);

    if (tasks.length === 0) {
      return { content: [{ type: 'text', text: 'No tasks found for this goal.' }] };
    }

    const lines = tasks.map(
      (t) =>
        `**[${t.id}]** ${t.title}\n  Type: ${t.task_type} | Status: ${t.status}${t.scheduled_for ? ` | Scheduled: ${t.scheduled_for}` : ''}`
    );

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error listing goal tasks: ${message}` }], isError: true };
  }
}
