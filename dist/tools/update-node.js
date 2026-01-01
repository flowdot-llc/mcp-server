/**
 * update_node MCP Tool
 *
 * Updates a node's position or properties.
 */
export const updateNodeTool = {
    name: 'update_node',
    description: 'Update a node\'s position or properties. Changes are immediately saved.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            node_id: {
                type: 'string',
                description: 'The node ID to update',
            },
            position: {
                type: 'object',
                properties: {
                    x: { type: 'number', description: 'New X position' },
                    y: { type: 'number', description: 'New Y position' },
                },
                required: ['x', 'y'],
                description: 'Optional new position for the node',
            },
            properties: {
                type: 'object',
                description: 'Optional property values to update',
            },
        },
        required: ['workflow_id', 'node_id'],
    },
};
export async function handleUpdateNode(api, args) {
    try {
        const updates = {};
        if (args.position)
            updates.position = args.position;
        if (args.properties)
            updates.properties = args.properties;
        const result = await api.updateNode(args.workflow_id, args.node_id, updates);
        // API returns { node_id, node: {...} }
        const node = result?.node || result;
        const position = node?.position;
        const lines = [
            '## Node Updated Successfully',
            '',
            `**Node ID:** ${node?.id || args.node_id}`,
            `**Type:** ${node?.type || 'unknown'}`,
            `**Title:** ${node?.title || 'Untitled'}`,
        ];
        if (position && typeof position.x === 'number' && typeof position.y === 'number') {
            lines.push(`**Position:** (${position.x}, ${position.y})`);
        }
        if (args.properties) {
            lines.push('', 'Updated properties have been applied.');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error updating node: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=update-node.js.map