/**
 * add_node MCP Tool
 *
 * Adds a new node to a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const addNodeTool: Tool = {
  name: 'add_node',
  description: 'Add a new node to a workflow. Supports both built-in nodes and custom nodes. For custom nodes, use the format "custom_node_{hash}" where {hash} is the custom node ID.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash) to add the node to',
      },
      node_type: {
        type: 'string',
        description: 'The type of node to add. For built-in nodes: "LLMNode", "HTTPRequestNode", etc. For custom nodes: "custom_node_{hash}" (e.g., "custom_node_abc123xyz")',
      },
      position: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'X position on the canvas' },
          y: { type: 'number', description: 'Y position on the canvas' },
        },
        required: ['x', 'y'],
        description: 'Position of the node on the workflow canvas',
      },
      properties: {
        type: 'object',
        description: 'Optional initial property values for the node',
      },
    },
    required: ['workflow_id', 'node_type', 'position'],
  },
};

export async function handleAddNode(
  api: FlowDotApiClient,
  args: {
    workflow_id: string;
    node_type: string;
    position: { x: number; y: number };
    properties?: Record<string, unknown>;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.addNode(
      args.workflow_id,
      args.node_type,
      args.position,
      args.properties
    );

    const lines = [
      '## Node Added Successfully',
      '',
      `**Node ID:** ${result.node_id}`,
      `**Type:** ${result.node.type}`,
      `**Title:** ${result.node.title}`,
      `**Position:** (${result.node.position.x}, ${result.node.position.y})`,
    ];

    if (result.node.inputs && result.node.inputs.length > 0) {
      lines.push('', `**Inputs:** ${result.node.inputs.map(i => i.name).join(', ')}`);
    }
    if (result.node.outputs && result.node.outputs.length > 0) {
      lines.push(`**Outputs:** ${result.node.outputs.map(o => o.name).join(', ')}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error adding node: ${message}` }],
      isError: true,
    };
  }
}
