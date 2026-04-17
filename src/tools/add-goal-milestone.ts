import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { CreateGoalMilestoneInput } from '../types.js';

export const addGoalMilestoneTool: Tool = {
  name: 'add_goal_milestone',
  description: 'Add a milestone to a goal. Milestones are progress markers with optional target dates.',
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
      title: { type: 'string', description: 'Milestone title' },
      description: { type: 'string', description: 'Milestone description' },
      target_date: { type: 'string', description: 'Target date (ISO 8601 format, e.g. 2026-05-01)' },
    },
    required: ['goal_hash', 'title'],
  },
};

export async function handleAddGoalMilestone(
  api: FlowDotApiClient,
  args: {
    goal_hash: string;
    title: string;
    description?: string;
    target_date?: string;
  }
): Promise<CallToolResult> {
  try {
    const input: CreateGoalMilestoneInput = {
      title: args.title,
      description: args.description,
      target_date: args.target_date,
    };

    const milestone = await api.addGoalMilestone(args.goal_hash, input);

    return {
      content: [
        {
          type: 'text',
          text: `Milestone added!\n\n**[${milestone.id}]** ${milestone.title}\n**Status:** ${milestone.status}${milestone.target_date ? `\n**Target Date:** ${milestone.target_date}` : ''}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error adding goal milestone: ${message}` }],
      isError: true,
    };
  }
}
