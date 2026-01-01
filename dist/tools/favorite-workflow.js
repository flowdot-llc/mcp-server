/**
 * favorite_workflow MCP Tool
 *
 * Favorites or unfavorites a workflow.
 */
export const favoriteWorkflowTool = {
    name: 'favorite_workflow',
    description: 'Add or remove a workflow from your favorites. Favorited workflows can be filtered in list_workflows.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            favorite: {
                type: 'boolean',
                description: 'Set to true to favorite, false to unfavorite',
            },
        },
        required: ['workflow_id', 'favorite'],
    },
};
export async function handleFavoriteWorkflow(api, args) {
    try {
        // API may return undefined (no data wrapper) or { message: "..." }
        const result = await api.favoriteWorkflow(args.workflow_id, args.favorite);
        const action = args.favorite ? 'added to' : 'removed from';
        const message = result?.message || `Workflow ${action} favorites.`;
        return {
            content: [{ type: 'text', text: message }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error updating favorite status: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=favorite-workflow.js.map