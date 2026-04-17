import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { CreateGoalTaskInput } from '../types.js';

export const addGoalTaskTool: Tool = {
  name: 'add_goal_task',
  description: `Add a task to a goal.

Task types:
- **research** — gather information
- **draft** — write content
- **code** — write or modify code
- **execute** — run a workflow
- **recipe** — invoke a specific recipe (use title to name the recipe alias)
- **loop** — repeat an action
- **notify** — send a notification
- **toolkit** — invoke an MCP toolkit tool

Tasks are executed by the FlowDot daemon/CLI when the goal runs.`,
  inputSchema: {
    type: 'object',
    properties: {
      goal_hash: { type: 'string', description: 'The goal hash' },
      title: { type: 'string', description: 'Task title (for recipe tasks, use the recipe alias)' },
      description: { type: 'string', description: 'Detailed description of the task' },
      task_type: {
        type: 'string',
        enum: ['research', 'draft', 'code', 'execute', 'recipe', 'loop', 'notify', 'toolkit', 'other'],
        description: 'Type of task',
      },
      scheduled_for: {
        type: 'string',
        description: 'ISO 8601 datetime to schedule this task for (optional)',
      },
    },
    required: ['goal_hash', 'title'],
  },
};

export async function handleAddGoalTask(
  api: FlowDotApiClient,
  args: {
    goal_hash: string;
    title: string;
    description?: string;
    task_type?: string;
    scheduled_for?: string;
  }
): Promise<CallToolResult> {
  try {
    const input: CreateGoalTaskInput = {
      title: args.title,
      description: args.description,
      task_type: args.task_type,
      scheduled_for: args.scheduled_for,
    };

    const task = await api.addGoalTask(args.goal_hash, input);

    return {
      content: [
        {
          type: 'text',
          text: `Task added!\n\n**[${task.id}]** ${task.title}\n**Type:** ${task.task_type}\n**Status:** ${task.status}${task.scheduled_for ? `\n**Scheduled:** ${task.scheduled_for}` : ''}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error adding goal task: ${message}` }], isError: true };
  }
}
