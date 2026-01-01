/**
 * delete_input_preset MCP Tool
 *
 * Deletes an input preset.
 */
export const deleteInputPresetTool = {
    name: 'delete_input_preset',
    description: 'Delete an input preset. You can only delete presets you created.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            preset_hash: {
                type: 'string',
                description: 'The input preset hash',
            },
        },
        required: ['workflow_id', 'preset_hash'],
    },
};
export async function handleDeleteInputPreset(api, args) {
    try {
        await api.deleteInputPreset(args.workflow_id, args.preset_hash);
        return {
            content: [{
                    type: 'text',
                    text: `Input preset ${args.preset_hash} has been deleted successfully.`,
                }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error deleting input preset: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=delete-input-preset.js.map