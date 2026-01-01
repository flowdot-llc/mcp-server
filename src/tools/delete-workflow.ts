/**
 * delete_workflow MCP Tool
 *
 * Deletes a workflow permanently.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteWorkflowTool: Tool = {
  name: 'delete_workflow',
  description: 'Permanently delete a workflow. This action cannot be undone. Only the workflow owner can delete it.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash) to delete',
      },
    },
    required: ['workflow_id'],
  },
};

export async function handleDeleteWorkflow(
  api: FlowDotApiClient,
  args: { workflow_id: string }
): Promise<CallToolResult> {
  try {
    // API may return undefined (no data wrapper) or { message: "..." }
    const result = await api.deleteWorkflow(args.workflow_id);

    const message = result?.message || `Workflow ${args.workflow_id} has been permanently deleted.`;

    return {
      content: [{ type: 'text', text: message }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting workflow: ${message}` }],
      isError: true,
    };
  }
}
