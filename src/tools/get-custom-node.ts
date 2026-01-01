/**
 * get_custom_node MCP Tool
 *
 * Get detailed information about a custom node including its script code.
 * Scope: custom_nodes:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getCustomNodeTool: Tool = {
  name: 'get_custom_node',
  description: 'Get detailed information about a custom node including inputs, outputs, properties, and script code.',
  inputSchema: {
    type: 'object',
    properties: {
      node_id: {
        type: 'string',
        description: 'The custom node ID (hash)',
      },
    },
    required: ['node_id'],
  },
};

export async function handleGetCustomNode(
  api: FlowDotApiClient,
  args: { node_id: string }
): Promise<CallToolResult> {
  try {
    const node = await api.getCustomNode(args.node_id);

    const lines = [
      `## ${node.name}${node.is_verified ? ' [Verified]' : ''}`,
      ``,
      `**ID:** ${node.id}`,
      `**Title:** ${node.title}`,
      `**Description:** ${node.description || 'No description'}`,
      ``,
      `### Metadata`,
      `- **Category:** ${node.category || 'custom'}`,
      `- **Version:** ${node.version || '1.0.0'}`,
      `- **Author:** ${node.user_name || 'Unknown'}`,
      `- **Visibility:** ${node.visibility}`,
      `- **Can Edit:** ${node.can_edit ? 'Yes' : 'No'}`,
      ``,
      `### Stats`,
      `- **Votes:** ${node.vote_count || 0} (Your vote: ${node.user_vote === 1 ? 'Up' : node.user_vote === -1 ? 'Down' : 'None'})`,
      `- **Favorites:** ${node.favorite_count || 0} (Favorited: ${node.is_favorited ? 'Yes' : 'No'})`,
      `- **Executions:** ${node.execution_count}`,
      `- **Copies:** ${node.copy_count}`,
      ``,
      `### Execution Settings`,
      `- **Timeout:** ${node.execution_timeout || 5000}ms`,
      `- **Memory Limit:** ${node.memory_limit || 128}MB`,
      ``,
    ];

    // Inputs
    if (node.inputs && node.inputs.length > 0) {
      lines.push(`### Inputs`);
      for (const input of node.inputs) {
        lines.push(`- **${input.name}** (${input.dataType})${input.description ? `: ${input.description}` : ''}`);
      }
      lines.push(``);
    }

    // Outputs
    if (node.outputs && node.outputs.length > 0) {
      lines.push(`### Outputs`);
      for (const output of node.outputs) {
        lines.push(`- **${output.name}** (${output.dataType})${output.description ? `: ${output.description}` : ''}`);
      }
      lines.push(``);
    }

    // Properties
    if (node.properties && node.properties.length > 0) {
      lines.push(`### Properties`);
      for (const prop of node.properties) {
        lines.push(`- **${prop.key}** (${prop.dataType}): ${JSON.stringify(prop.value)}`);
      }
      lines.push(``);
    }

    // Tags
    if (node.tags && node.tags.length > 0) {
      lines.push(`### Tags`);
      lines.push(node.tags.join(', '));
      lines.push(``);
    }

    // Script code
    if (node.script_code) {
      lines.push(`### Script Code`);
      lines.push('```javascript');
      lines.push(node.script_code);
      lines.push('```');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting custom node: ${message}` }],
      isError: true,
    };
  }
}
