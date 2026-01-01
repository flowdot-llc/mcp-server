/**
 * list_custom_nodes MCP Tool
 *
 * Lists the user's own custom nodes with optional search and category filtering.
 * Scope: custom_nodes:read
 */
export const listCustomNodesTool = {
    name: 'list_custom_nodes',
    description: 'List your own custom nodes. Supports search and category filtering.',
    inputSchema: {
        type: 'object',
        properties: {
            search: {
                type: 'string',
                description: 'Search term to filter nodes by name, title, or description',
            },
            category: {
                type: 'string',
                description: 'Filter by category',
            },
            limit: {
                type: 'number',
                default: 50,
                description: 'Maximum number of results (1-100)',
            },
            page: {
                type: 'number',
                default: 1,
                description: 'Page number for pagination',
            },
        },
        required: [],
    },
};
export async function handleListCustomNodes(api, args) {
    try {
        const result = await api.listCustomNodes(args);
        const nodes = Array.isArray(result?.data) ? result.data : [];
        if (nodes.length === 0) {
            return {
                content: [{ type: 'text', text: 'No custom nodes found.' }],
            };
        }
        const lines = [
            `## Your Custom Nodes`,
            ``,
            `Found ${result.total} custom nodes (page ${result.current_page}/${result.last_page})`,
            ``,
        ];
        for (const node of nodes) {
            lines.push(`### ${node.name}`);
            lines.push(`- **ID:** ${node.id}`);
            lines.push(`- **Title:** ${node.title}`);
            if (node.description) {
                lines.push(`- **Description:** ${node.description.substring(0, 100)}${node.description.length > 100 ? '...' : ''}`);
            }
            lines.push(`- **Category:** ${node.category || 'custom'}`);
            lines.push(`- **Version:** ${node.version || '1.0.0'}`);
            lines.push(`- **Visibility:** ${node.visibility}`);
            if (node.is_verified)
                lines.push(`- **Verified:** Yes`);
            lines.push(`- **Executions:** ${node.execution_count} | **Copies:** ${node.copy_count}`);
            if (node.tags && node.tags.length > 0) {
                lines.push(`- **Tags:** ${node.tags.join(', ')}`);
            }
            lines.push(``);
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error listing custom nodes: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=list-custom-nodes.js.map