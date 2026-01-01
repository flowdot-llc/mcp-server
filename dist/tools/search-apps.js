/**
 * search_apps Tool
 *
 * Search public apps by name, description, category, or tags.
 * Required scope: apps:read
 */
export const searchAppsTool = {
    name: 'search_apps',
    description: `Search the FlowDot app marketplace for public apps created by other users.

Apps are React frontend applications that can optionally use workflows as backends. You can search by keywords, filter by category/tag, and sort results.

Use this to discover reusable apps that can be cloned and customized.`,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query (searches name and description)',
            },
            category: {
                type: 'string',
                description: 'Filter by category',
            },
            tag: {
                type: 'string',
                description: 'Filter by a specific tag',
            },
            mobile_compatible: {
                type: 'boolean',
                description: 'Only show mobile-compatible apps',
            },
            sort: {
                type: 'string',
                enum: ['trending', 'popular', 'recent', 'most_used'],
                description: 'Sort order (default: trending)',
            },
            limit: {
                type: 'number',
                description: 'Maximum number of apps to return (default: 20, max: 100)',
            },
            page: {
                type: 'number',
                description: 'Page number for pagination (default: 1)',
            },
        },
    },
};
export async function handleSearchApps(client, args) {
    try {
        const filters = {};
        if (args.query)
            filters.q = String(args.query);
        if (args.category)
            filters.category = String(args.category);
        if (args.tag)
            filters.tag = String(args.tag);
        if (args.mobile_compatible)
            filters.mobile_compatible = Boolean(args.mobile_compatible);
        if (args.sort)
            filters.sort = args.sort;
        if (args.limit)
            filters.limit = Number(args.limit);
        if (args.page)
            filters.page = Number(args.page);
        const result = await client.searchPublicApps(filters);
        if (!result.data || result.data.length === 0) {
            return {
                content: [{ type: 'text', text: 'No public apps found matching your search criteria.' }],
            };
        }
        const appsInfo = result.data.map((app) => {
            const tags = app.tags?.length ? `[${app.tags.join(', ')}]` : '';
            const badges = [];
            if (app.is_verified)
                badges.push('Verified');
            if (app.is_featured)
                badges.push('Featured');
            const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
            return `- **${app.name}** (${app.id})${badgeStr}
  By: ${app.user_name || 'Unknown'}
  ${app.description || 'No description'}
  Category: ${app.category || 'Uncategorized'} | Mobile: ${app.mobile_compatible ? 'Yes' : 'No'}
  Upvotes: ${app.upvotes} | Executions: ${app.execution_count} | Clones: ${app.clone_count}
  ${tags ? `Tags: ${tags}` : ''}`;
        });
        const text = `Found ${result.total} public app(s) (page ${result.current_page}/${result.last_page}):

${appsInfo.join('\n\n')}

Tip: Use get_app to see full details and code, or clone_app to copy to your library.`;
        return {
            content: [{ type: 'text', text }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error searching apps: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=search-apps.js.map