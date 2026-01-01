/**
 * set_workflow_tags MCP Tool
 *
 * Sets/updates the tags on a workflow.
 */
export const setWorkflowTagsTool = {
    name: 'set_workflow_tags',
    description: 'Set or update the tags/categories on a workflow. Replaces existing tags.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of tags to set on the workflow',
            },
        },
        required: ['workflow_id', 'tags'],
    },
};
export async function handleSetWorkflowTags(api, args) {
    try {
        // API may return undefined (no data wrapper) or { message: "..." }
        const result = await api.setWorkflowTags(args.workflow_id, args.tags);
        const message = result?.message || `Tags updated: ${args.tags.join(', ')}`;
        return {
            content: [{ type: 'text', text: message }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error setting workflow tags: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=set-workflow-tags.js.map