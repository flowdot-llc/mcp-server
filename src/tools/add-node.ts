/**
 * add_node MCP Tool
 *
 * Adds a new node to a workflow.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const addNodeTool: Tool = {
  name: 'add_node',
  description: 'Add a new node to a workflow. Supports built-in nodes, custom nodes, and toolkit-tool nodes. For custom nodes, use "custom_node_{hash}". For a tool from an INSTALLED toolkit, use "toolkit_{toolkitId}_{toolName}" (e.g. "toolkit_xS03HmGAag_get_markets") — the tool\'s inputs become input sockets, each required credential becomes a "_cred_<KEY>" input resolved from your installation, and the node outputs "result". This is how a workflow calls signed third-party APIs deterministically (no agent). Discover them with list_available_nodes and list_toolkit_tools.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash) to add the node to',
      },
      node_type: {
        type: 'string',
        description: 'The type of node to add. Built-in nodes: e.g. "text_input", "llm_query_generator", "conditional_branch" (confirm exact types via list_available_nodes). Custom nodes: "custom_node_{hash}" (e.g. "custom_node_abc123xyz"). Toolkit-tool nodes: "toolkit_{toolkitId}_{toolName}" for any tool of an installed toolkit (e.g. "toolkit_xS03HmGAag_get_markets"); inputs auto-expose as sockets, credentials as "_cred_<KEY>" inputs, output is "result".',
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
