/**
 * duplicate_workflow MCP Tool
 *
 * Duplicates/clones an existing workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const duplicateWorkflowTool: Tool = {
  name: 'duplicate_workflow',
  description: 'Create a copy of an existing workflow. The new workflow will be private and editable.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash) to duplicate',
      },
      name: {
        type: 'string',
        description: 'Optional name for the new workflow. Defaults to "Copy of [original name]"',
      },
    },
    required: ['workflow_id'],
  },
};

export async function handleDuplicateWorkflow(
  api: FlowDotApiClient,
  args: { workflow_id: string; name?: string }
): Promise<CallToolResult> {
  try {
    const result = await api.duplicateWorkflow(args.workflow_id, args.name);

    const lines = [
      '## Workflow Duplicated Successfully',
      '',
      `**New Workflow ID:** ${result.id}`,
      `**Name:** ${result.name}`,
      `**Description:** ${result.description || 'None'}`,
      `**Created:** ${result.created_at}`,
      '',
      'The new workflow is private and ready for editing.',
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error duplicating workflow: ${message}` }],
      isError: true,
    };
  }
}
