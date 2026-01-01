/**
 * delete_custom_node MCP Tool
 *
 * Delete a custom node.
 * Scope: custom_nodes:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteCustomNodeTool: Tool = {
  name: 'delete_custom_node',
  description: 'Delete a custom node. This action cannot be undone.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash) to delete',
      },
    },
    required: ['node_id'],
  },
};

export async function handleDeleteCustomNode(
  api: FlowDotApiClient,
  args: { node_id: string }
): Promise<CallToolResult> {
  try {
    await api.deleteCustomNode(args.node_id);

    return {
      content: [
        {
          type: 'text',
          text: `## Custom Node Deleted\n\n**Node ID:** ${args.node_id}\n\nThe custom node has been permanently deleted.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting custom node: ${message}` }],
      isError: true,
    };
  }
}
