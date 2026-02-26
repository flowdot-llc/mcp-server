/**
 * browse_recipes MCP Tool
 *
 * Browse public agent recipes shared by other users.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { RecipeSearchFilters } from '../types.js';

export const browseRecipesTool: Tool = {
  name: 'browse_recipes',
  description:
    'Browse public agent recipes shared by other users. Search by name, category, or tags.',
  inputSchema: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Search query to filter recipes by name or description',
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
      sort: {
        type: 'string',
        enum: ['popular', 'recent', 'most_forked'],
        default: 'popular',
        description: 'Sort order',
      },
      page: {
        type: 'number',
        default: 1,
        description: 'Page number for pagination',
      },
    },
  },
};

export async function handleBrowseRecipes(
  api: FlowDotApiClient,
  args: {
    search?: string;
    category?: string;
    tags?: string[];
    sort?: 'popular' | 'recent' | 'most_forked';
    page?: number;
  }
): Promise<CallToolResult> {
  try {
    const filters: RecipeSearchFilters = {
      q: args.search,
      category: args.category,
      tags: args.tags,
      sort: args.sort || 'popular',
      page: args.page || 1,
    };

    const response = await api.listPublicRecipes(filters);

    const recipes = response.data || [];

    if (recipes.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No public recipes found matching your criteria.',
          },
        ],
      };
    }

    // Format as a readable list
    const recipeList = recipes
      .filter((r) => r && typeof r === 'object')
      .map((r) => {
        const desc = r.description ? ` - ${r.description}` : '';
        const steps = r.step_count !== undefined ? ` [${r.step_count} steps]` : '';
        const author = r.user_name ? ` by ${r.user_name}` : '';
        const stats = [];
        if (r.fork_count !== undefined && r.fork_count > 0) stats.push(`${r.fork_count} forks`);
        if (r.vote_count !== undefined && r.vote_count > 0) stats.push(`+${r.vote_count}`);
        const statsStr = stats.length > 0 ? ` (${stats.join(', ')})` : '';
        return `- **${r.name}** (${r.hash})${author}${steps}${statsStr}${desc}`;
      })
      .join('\n');

    let paginationInfo = '';
    if (response.current_page !== undefined) {
      paginationInfo = `\n\nPage ${response.current_page} of ${response.last_page} (${response.total} total recipes)`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Public Recipes:\n\n${recipeList}${paginationInfo}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error browsing recipes: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
