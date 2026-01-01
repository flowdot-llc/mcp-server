/**
 * delete_connection MCP Tool
 *
 * Deletes a connection from a workflow.
 */
export const deleteConnectionTool = {
    name: 'delete_connection',
    description: 'Remove a connection between two nodes in a workflow.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            connection_id: {
                type: 'string',
                description: 'The connection ID to delete',
            },
        },
        required: ['workflow_id', 'connection_id'],
    },
};
export async function handleDeleteConnection(api, args) {
    try {
        // API may return undefined (no data wrapper) or { message: "..." }
        const result = await api.deleteConnection(args.workflow_id, args.connection_id);
        const message = result?.message || `Connection ${args.connection_id} has been deleted.`;
        return {
            content: [{ type: 'text', text: message }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error deleting connection: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=delete-connection.js.map