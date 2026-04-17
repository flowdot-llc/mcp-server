import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const deleteGoalTaskTool: Tool = {
  name: 'delete_goal_task',
  description: 'Delete a task from a goal.',
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
      task_id: { type: 'number', description: 'The task ID' },
    },
    required: ['goal_hash', 'task_id'],
  },
};

export async function handleDeleteGoalTask(
  api: FlowDotApiClient,
  args: { goal_hash: string; task_id: number }
): Promise<CallToolResult> {
  try {
    await api.deleteGoalTask(args.goal_hash, args.task_id);
    return { content: [{ type: 'text', text: `Task ${args.task_id} deleted from goal ${args.goal_hash}.` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error deleting goal task: ${message}` }], isError: true };
  }
}
