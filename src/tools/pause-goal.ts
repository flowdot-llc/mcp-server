import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const pauseGoalTool: Tool = {
  name: 'pause_goal',
  description: 'Pause an active goal. The daemon will stop processing tasks for this goal.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The goal hash' },
    },
    required: ['hash'],
  },
};

export async function handlePauseGoal(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const goal = await api.pauseGoal(args.hash);
    return { content: [{ type: 'text', text: `Goal "${goal.name}" paused. Status: ${goal.status}` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error pausing goal: ${message}` }], isError: true };
  }
}
