import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const completeGoalTool: Tool = {
  name: 'complete_goal',
  description: 'Mark a goal as completed.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The goal hash' },
    },
    required: ['hash'],
  },
};

export async function handleCompleteGoal(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const goal = await api.completeGoal(args.hash);
    return { content: [{ type: 'text', text: `Goal "${goal.name}" marked as completed. Status: ${goal.status}` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error completing goal: ${message}` }], isError: true };
  }
}
