/**
 * delete_node MCP Tool
 *
 * Deletes a node from a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteNodeTool: Tool = {
  name: 'delete_node',
  description: 'Delete a node from a workflow. This also removes all connections to/from the node.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      node_id: {
        type: 'string',
        description: 'The node ID to delete',
      },
    },
    required: ['workflow_id', 'node_id'],
  },
};

export async function handleDeleteNode(
  api: FlowDotApiClient,
  args: { workflow_id: string; node_id: string }
): Promise<CallToolResult> {
  try {
    // API may return undefined (no data wrapper) or { message: "..." }
    const result = await api.deleteNode(args.workflow_id, args.node_id);

    const message = result?.message || `Node ${args.node_id} has been deleted.`;

    return {
      content: [{ type: 'text', text: message }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting node: ${message}` }],
      isError: true,
    };
  }
}
