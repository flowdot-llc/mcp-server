import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const deleteGoalTool: Tool = {
  name: 'delete_goal',
  description: 'Permanently delete a goal and all its tasks and milestones.',
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

export async function handleDeleteGoal(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    await api.deleteGoal(args.hash);
    return { content: [{ type: 'text', text: `Goal ${args.hash} deleted successfully.` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error deleting goal: ${message}` }], isError: true };
  }
}
