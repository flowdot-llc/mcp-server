/**
 * search_public_custom_nodes MCP Tool
 *
 * Search public custom nodes shared by the community.
 * Scope: custom_nodes:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const searchPublicCustomNodesTool: Tool = {
  name: 'search_public_custom_nodes',
  description: 'Search public custom nodes shared by the community.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for name, title, or description',
      },
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      },
      verified_only: {
        type: 'boolean',
        default: false,
        description: 'Only show verified nodes',
      },
      sort: {
        type: 'string',
        enum: ['updated_at', 'created_at', 'execution_count', 'copy_count'],
        default: 'updated_at',
        description: 'Sort order',
      },
      limit: {
        type: 'number',
        default: 20,
        description: 'Maximum results (1-100)',
      },
      page: {
        type: 'number',
        default: 1,
        description: 'Page number',
      },
    },
    required: [],
  },
};

export async function handleSearchPublicCustomNodes(
  api: FlowDotApiClient,
  args: {
    query?: string;
    category?: string;
    tags?: string[];
    verified_only?: boolean;
    sort?: string;
    limit?: number;
    page?: number;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.searchPublicCustomNodes({
      q: args.query,
      category: args.category,
      tags: args.tags,
      verified_only: args.verified_only,
      sort: args.sort as 'updated_at' | 'created_at' | 'execution_count' | 'copy_count',
      limit: args.limit,
      page: args.page,
    });

    const nodes = Array.isArray(result?.data) ? result.data : [];

    if (nodes.length === 0) {
      return {
        content: [{ type: 'text', text: 'No public custom nodes found matching your criteria.' }],
      };
    }

    const lines = [
      `## Public Custom Nodes`,
      ``,
      `Found ${result.total} nodes (page ${result.current_page}/${result.last_page})`,
      ``,
    ];

    for (const node of nodes) {
      lines.push(`### ${node.name}${node.is_verified ? ' [Verified]' : ''}`);
      lines.push(`- **ID:** ${node.id}`);
      lines.push(`- **Author:** ${node.user_name || 'Unknown'}`);
      lines.push(`- **Title:** ${node.title}`);
      if (node.description) {
        lines.push(`- **Description:** ${node.description.substring(0, 100)}${node.description.length > 100 ? '...' : ''}`);
      }
      lines.push(`- **Category:** ${node.category || 'custom'}`);
      lines.push(`- **Votes:** ${node.vote_count || 0} | **Executions:** ${node.execution_count} | **Copies:** ${node.copy_count}`);
      if (node.tags && node.tags.length > 0) {
        lines.push(`- **Tags:** ${node.tags.join(', ')}`);
      }
      lines.push(``);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error searching public custom nodes: ${message}` }],
      isError: true,
    };
  }
}
