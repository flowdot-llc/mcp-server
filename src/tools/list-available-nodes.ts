/**
 * list_available_nodes MCP Tool
 *
 * Lists all available node types that can be added to workflows.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { NodeType, NodeTypesResponse } from '../types.js';

export const listAvailableNodesTool: Tool = {
  name: 'list_available_nodes',
  description: 'List all available node types organized by category. Shows node types, descriptions, and capabilities.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleListAvailableNodes(
  api: FlowDotApiClient,
  _args: Record<string, never>
): Promise<CallToolResult> {
  try {
    const response = await api.listAvailableNodes();

    // Handle null/undefined explicitly (typeof null === 'object' in JS)
    if (response === null || response === undefined) {
      return {
        content: [{ type: 'text', text: 'No node types available.' }],
      };
    }

    // Handle both array and object formats from the API
    let nodeList: NodeType[];

    if (Array.isArray(response)) {
      // Response is already an array of node types
      nodeList = response;
    } else if (typeof response === 'object' && response !== null) {
      // Response is an object keyed by node type name - extract values
      nodeList = Object.values(response);
    } else {
      return {
        content: [{ type: 'text', text: `Unexpected response format: ${typeof response}` }],
        isError: true,
      };
    }

    // Filter out any invalid entries (non-objects or objects without type)
    nodeList = nodeList.filter((node): node is NodeType =>
      node !== null &&
      typeof node === 'object' &&
      typeof (node as NodeType).type === 'string'
    );

    if (nodeList.length === 0) {
      return {
        content: [{ type: 'text', text: 'No node types available.' }],
      };
    }

    // Group by category
    const byCategory: Record<string, NodeType[]> = {};
    for (const node of nodeList) {
      const category = node.category || 'other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(node);
    }

    const lines = ['## Available Node Types', ''];

    for (const [category, categoryNodes] of Object.entries(byCategory)) {
      lines.push(`### ${category}`);
      for (const node of categoryNodes) {
        const experimental = node.experimental ? ' [EXPERIMENTAL]' : '';
        const pinned = node.pinned ? ' [PINNED]' : '';
        lines.push(`- **${node.title}** (\`${node.type}\`)${experimental}${pinned}`);
        lines.push(`  ${node.description}`);
        if (node.use_case) {
          lines.push(`  Use case: ${node.use_case}`);
        }
      }
      lines.push('');
    }

    // Add custom node documentation section
    lines.push('---');
    lines.push('');
    lines.push('### custom');
    lines.push('- **Custom Nodes** - User-defined nodes with JavaScript logic');
    lines.push('  - Script must define: `function processData(inputs, properties) { return { OutputName: value }; }`');
    lines.push('  - Valid dataTypes: text, number, boolean, json, array, any');
    lines.push('  - Use `list_custom_nodes` to see your custom nodes');
    lines.push('  - Use `create_custom_node` to create new ones');
    lines.push('  - Use `get_custom_node_template` to generate script boilerplate');
    lines.push('');

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing available nodes: ${message}` }],
      isError: true,
    };
  }
}
