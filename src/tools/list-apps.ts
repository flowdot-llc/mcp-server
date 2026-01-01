/**
 * list_apps Tool
 *
 * Lists the user's own apps with optional filtering.
 * Required scope: apps:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { AppListFilters } from '../types.js';

export const listAppsTool: Tool = {
  name: 'list_apps',
  description: `List the user's own FlowDot apps. Apps are React frontend applications that can optionally use workflows as backends.

Returns a paginated list of apps owned by the current user with metadata like name, description, category, tags, and usage stats.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      search: {
        type: 'string',
        description: 'Filter apps by name or description',
      },
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of apps to return (default: 50, max: 100)',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 1)',
      },
    },
  },
};

export async function handleListApps(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const options: AppListFilters = {};

    if (args.search) options.search = String(args.search);
    if (args.category) options.category = String(args.category);
    if (args.limit) options.limit = Number(args.limit);
    if (args.page) options.page = Number(args.page);

    const result = await client.listApps(options);

    if (!result.data || result.data.length === 0) {
      return {
        content: [{ type: 'text', text: 'No apps found. Create your first app using the create_app tool.' }],
      };
    }

    const appsInfo = result.data.map((app) => {
      const tags = app.tags?.length ? `[${app.tags.join(', ')}]` : '';
      const status = app.is_public ? 'Public' : 'Private';
      return `- **${app.name}** (${app.id})
  ${app.description || 'No description'}
  Category: ${app.category || 'Uncategorized'} | Status: ${status} | Mobile: ${app.mobile_compatible ? 'Yes' : 'No'}
  Executions: ${app.execution_count} | Upvotes: ${app.upvotes} | Clones: ${app.clone_count}
  ${tags ? `Tags: ${tags}` : ''}`;
    });

    const text = `Found ${result.total} app(s) (page ${result.current_page}/${result.last_page}):

${appsInfo.join('\n\n')}`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing apps: ${message}` }],
      isError: true,
    };
  }
}
