/**
 * toggle_workflow_public MCP Tool
 *
 * Toggles a workflow's public/private visibility status.
 */
export const toggleWorkflowPublicTool = {
    name: 'toggle_workflow_public',
    description: 'Make a workflow public or private. Public workflows are visible to all users.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            is_public: {
                type: 'boolean',
                description: 'Set to true to make public, false to make private',
            },
        },
        required: ['workflow_id', 'is_public'],
    },
};
export async function handleToggleWorkflowPublic(api, args) {
    try {
        // API may return undefined (no data wrapper) or { message: "..." }
        const result = await api.toggleWorkflowPublic(args.workflow_id, args.is_public);
        const status = args.is_public ? 'public' : 'private';
        const message = result?.message || `Workflow is now ${status}.`;
        return {
            content: [{ type: 'text', text: message }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error toggling workflow visibility: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=toggle-workflow-public.js.map