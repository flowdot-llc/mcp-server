/**
 * get_node_connections MCP Tool
 *
 * Gets all connections for a specific node.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getNodeConnectionsTool: Tool = {
  name: 'get_node_connections',
  description: 'Get all connections to and from a specific node in a workflow.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      node_id: {
        type: 'string',
        description: 'The node ID to get connections for',
      },
    },
    required: ['workflow_id', 'node_id'],
  },
};

export async function handleGetNodeConnections(
  api: FlowDotApiClient,
  args: { workflow_id: string; node_id: string }
): Promise<CallToolResult> {
  try {
    // API returns { node_id, incoming: [...], outgoing: [...], total: N }
    const result = await api.getNodeConnections(args.workflow_id, args.node_id) as any;

    const incoming = Array.isArray(result?.incoming) ? result.incoming : [];
    const outgoing = Array.isArray(result?.outgoing) ? result.outgoing : [];
    const total = result?.total ?? (incoming.length + outgoing.length);

    if (total === 0) {
      return {
        content: [{ type: 'text', text: `Node ${args.node_id} has no connections.` }],
      };
    }

    const lines = [
      `## Connections for Node ${args.node_id}`,
      '',
      `**Total:** ${total} (${incoming.length} incoming, ${outgoing.length} outgoing)`,
    ];

    if (incoming.length > 0) {
      lines.push('', '### Incoming');
      for (const conn of incoming) {
        const feedback = conn.isFeedback ? ' (feedback)' : '';
        lines.push(`- ${conn.sourceNodeId}.${conn.sourceSocketId} -> ${conn.targetSocketId}${feedback}`);
      }
    }

    if (outgoing.length > 0) {
      lines.push('', '### Outgoing');
      for (const conn of outgoing) {
        const feedback = conn.isFeedback ? ' (feedback)' : '';
        lines.push(`- ${conn.sourceSocketId} -> ${conn.targetNodeId}.${conn.targetSocketId}${feedback}`);
      }
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting node connections: ${message}` }],
      isError: true,
    };
  }
}
