/**
 * add_connection MCP Tool
 *
 * Adds a connection between two nodes.
 */
export const addConnectionTool = {
    name: 'add_connection',
    description: 'Create a connection between two nodes in a workflow. Connects an output socket to an input socket.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            source_node_id: {
                type: 'string',
                description: 'The source node ID (where the connection starts)',
            },
            source_socket_id: {
                type: 'string',
                description: 'The output socket name on the source node',
            },
            target_node_id: {
                type: 'string',
                description: 'The target node ID (where the connection ends)',
            },
            target_socket_id: {
                type: 'string',
                description: 'The input socket name on the target node',
            },
        },
        required: ['workflow_id', 'source_node_id', 'source_socket_id', 'target_node_id', 'target_socket_id'],
    },
};
export async function handleAddConnection(api, args) {
    try {
        const result = await api.addConnection(args.workflow_id, args.source_node_id, args.source_socket_id, args.target_node_id, args.target_socket_id);
        const conn = result.connection;
        const lines = [
            '## Connection Added Successfully',
            '',
            `**Connection ID:** ${result.connection_id}`,
            `**From:** ${conn.sourceNodeId}.${conn.sourceSocketId}`,
            `**To:** ${conn.targetNodeId}.${conn.targetSocketId}`,
        ];
        if (conn.isFeedback) {
            lines.push('', '*This is a feedback connection.*');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error adding connection: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=add-connection.js.map