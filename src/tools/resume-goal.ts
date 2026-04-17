import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const resumeGoalTool: Tool = {
  name: 'resume_goal',
  description: 'Resume a paused goal.',
  inputSchema: {
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The goal hash' },
    },
    required: ['hash'],
  },
};

export async function handleResumeGoal(
  api: FlowDotApiClient,
  args: { hash: string }
): Promise<CallToolResult> {
  try {
    const goal = await api.resumeGoal(args.hash);
    return { content: [{ type: 'text', text: `Goal "${goal.name}" resumed. Status: ${goal.status}` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error resuming goal: ${message}` }], isError: true };
  }
}
