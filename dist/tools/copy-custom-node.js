/**
 * copy_custom_node MCP Tool
 *
 * Copy a public custom node to your library.
 * Scope: custom_nodes:manage
 */
export const copyCustomNodeTool = {
    name: 'copy_custom_node',
    description: 'Copy a public custom node to your library. The copy will be private by default.',
    inputSchema: {
        type: 'object',
        properties: {
            node_id: {
                type: 'string',
                description: 'The custom node ID (hash) to copy',
            },
            name: {
                type: 'string',
                description: 'Optional new name for the copy (defaults to original name with "(copy)" suffix)',
            },
        },
        required: ['node_id'],
    },
};
export async function handleCopyCustomNode(api, args) {
    try {
        const result = await api.copyCustomNode(args.node_id, args.name);
        const lines = [
            `## Custom Node Copied Successfully`,
            ``,
            `**New Node ID:** ${result.id}`,
            `**Name:** ${result.name}`,
            `**Created:** ${result.created_at}`,
            ``,
            `The node has been copied to your library as a private custom node.`,
            `You can now edit and customize it as needed.`,
        ];
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error copying custom node: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=copy-custom-node.js.map