/**
 * toggle_custom_node_visibility MCP Tool
 *
 * Change the visibility of a custom node.
 * Scope: custom_nodes:manage
 */
export const toggleCustomNodeVisibilityTool = {
    name: 'toggle_custom_node_visibility',
    description: 'Change the visibility of a custom node (private, public, or unlisted).',
    inputSchema: {
        type: 'object',
        properties: {
            node_id: {
                type: 'string',
                description: 'The custom node ID (hash)',
            },
            visibility: {
                type: 'string',
                enum: ['private', 'public', 'unlisted'],
                description: 'New visibility setting. If not specified, toggles between public and private.',
            },
        },
        required: ['node_id'],
    },
};
export async function handleToggleCustomNodeVisibility(api, args) {
    try {
        // Default to 'public' if not specified (will toggle in the backend)
        const visibility = args.visibility || 'public';
        await api.toggleCustomNodeVisibility(args.node_id, visibility);
        const lines = [
            `## Visibility Updated`,
            ``,
            `**Node ID:** ${args.node_id}`,
            `**New Visibility:** ${visibility}`,
            ``,
        ];
        if (visibility === 'public') {
            lines.push('The custom node is now publicly visible and can be found by other users.');
        }
        else if (visibility === 'private') {
            lines.push('The custom node is now private and only visible to you.');
        }
        else {
            lines.push('The custom node is now unlisted. It can only be accessed with a direct link.');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error changing visibility: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=toggle-custom-node-visibility.js.map