/**
 * browse_recipes MCP Tool
 *
 * Browse public agent recipes shared by other users.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { RecipeSearchFilters } from '../types.js';

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

    // `listPublicRecipes` resolves to the recipes themselves — the API client's
    // `request()` has already stripped the Hub's `{ success, data }` envelope.
    // Reading `.data` off that array yielded `undefined`, so every call reported
    // an empty library no matter how many public recipes existed.
    const recipes = await api.listPublicRecipes(filters);

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

    // Format as a readable list. Field names follow what
    // `McpApiController::listPublicAgentRecipes` actually serialises: the author
    // is nested under `author.display_name` and votes are split
    // `upvotes`/`downvotes`. The previous `user_name` / `vote_count` reads were
    // never populated, so author and score silently never rendered.
    const recipeList = recipes
      .filter((r) => r && typeof r === 'object')
      .map((r) => {
        const rec = r as typeof r & {
          author?: { display_name?: string };
          upvotes?: number;
          downvotes?: number;
        };
        const desc = rec.description ? ` - ${rec.description}` : '';
        const steps = rec.step_count !== undefined ? ` [${rec.step_count} steps]` : '';
        const authorName = rec.author?.display_name;
        const author = authorName ? ` by ${authorName}` : '';
        const stats: string[] = [];
        if (rec.fork_count) stats.push(`${rec.fork_count} forks`);
        const score = (rec.upvotes ?? 0) - (rec.downvotes ?? 0);
        if (score > 0) stats.push(`+${score}`);
        const statsStr = stats.length > 0 ? ` (${stats.join(', ')})` : '';
        return `- **${rec.name}** (${rec.hash})${author}${steps}${statsStr}${desc}`;
      })
      .join('\n');

    // The Hub's `pagination` block is a sibling of `data` and is dropped by the
    // client's envelope unwrap, so state the page that was actually fetched
    // rather than inventing a total.
    const page = filters.page ?? 1;
    const pageInfo = `\n\nPage ${page} — ${recipes.length} recipe(s) returned.`
      + `\nLink one for execution with link_recipe(hash, alias).`;

    return {
      content: [
        {
          type: 'text',
          text: `Public Recipes:\n\n${recipeList}${pageInfo}`,
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
