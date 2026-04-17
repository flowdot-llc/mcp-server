import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const abandonGoalTool: Tool = {
  name: 'abandon_goal',
  description: 'Abandon a goal. Use this when a goal is no longer relevant but you want to keep it for record-keeping rather than deleting it.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The goal hash' },
    },
    required: ['hash'],
  },
};

export async function handleAbandonGoal(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const goal = await api.abandonGoal(args.hash);
    return { content: [{ type: 'text', text: `Goal "${goal.name}" abandoned. Status: ${goal.status}` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error abandoning goal: ${message}` }], isError: true };
  }
}
