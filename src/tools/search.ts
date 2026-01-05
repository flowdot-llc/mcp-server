/**
 * search MCP Tool
 *
 * A general-purpose search tool for FlowDot resources.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import {
  Workflow,
  App,
  CustomNode,
  PaginatedResult,
} from '../types.js';

export const searchTool: Tool = {
  name: 'search',
  description: 'Search for resources like workflows, apps, and custom nodes within the FlowDot platform.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to match against resource name, description, or tags.',
      },
      type: {
        type: 'string',
        description: "Optional: The type of resource to search for. Can be 'workflow', 'app', or 'custom_node'. If omitted, all types are searched.",
        enum: ['workflow', 'app', 'custom_node'],
      },
      page: {
        type: 'number',
        description: 'Page number for pagination.',
        default: 1,
      },
    },
    required: ['query'],
  },
};

export async function handleSearch(
  api: FlowDotApiClient,
  args: { query: string; type?: 'workflow' | 'app' | 'custom_node'; page?: number }
): Promise<CallToolResult> {
  const { query, type, page = 1 } = args;

  try {
    const searchPromises: Promise<PaginatedResult<Workflow | App | CustomNode>>[] = [];
    const typesToSearch: ('workflow' | 'app' | 'custom_node')[] = [];

    if (!type || type === 'workflow') {
      searchPromises.push(api.searchWorkflows(query, undefined, page));
      typesToSearch.push('workflow');
    }
    if (!type || type === 'app') {
      searchPromises.push(api.searchPublicApps({ q: query, page }));
      typesToSearch.push('app');
    }
    if (!type || type === 'custom_node') {
      searchPromises.push(api.searchPublicCustomNodes({ q: query, page }));
      typesToSearch.push('custom_node');
    }

    const results = await Promise.allSettled(searchPromises);

    let lines: string[] = [];
    let totalResults = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const paginatedResult = result.value;
        const items = Array.isArray(paginatedResult?.data) ? paginatedResult.data : [];
        if (items.length > 0) {
          const resourceType = typesToSearch[index];
          lines.push(`### ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}s`);
          items.forEach(item => {
            const visibility = ('is_public' in item && item.is_public) ? ' (public)' : '';
            const desc = item.description ? ` - ${item.description}` : '';
            lines.push(`- **${item.name}** (${item.id})${visibility}${desc}`);
          });
          lines.push('');
          totalResults += items.length;
        }
      }
    });

    if (totalResults === 0) {
      return {
        content: [{ type: 'text', text: `No results found for "${query}".` }],
      };
    }

    const header = `## Search Results for "${query}" (Page ${page})`;
    lines.unshift(header, '');

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error during search: ${message}` }],
      isError: true,
    };
  }
}
