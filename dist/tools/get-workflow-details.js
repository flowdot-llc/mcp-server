/**
 * get_workflow_details MCP Tool
 *
 * Gets detailed workflow information including nodes, connections, and signature.
 */
export const getWorkflowDetailsTool = {
    name: 'get_workflow_details',
    description: 'Get detailed workflow information including nodes, connections, input/output signature, and metadata.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
        },
        required: ['workflow_id'],
    },
};
export async function handleGetWorkflowDetails(api, args) {
    try {
        const details = await api.getWorkflowDetails(args.workflow_id);
        const lines = [
            `## ${details.name}`,
            '',
            details.description || 'No description',
            '',
            `**ID:** ${details.id}`,
            `**Public:** ${details.is_public ? 'Yes' : 'No'}`,
            `**Visibility:** ${details.visibility}`,
            `**Disabled:** ${details.is_disabled ? 'Yes' : 'No'}`,
            `**Favorited:** ${details.is_favorited ? 'Yes' : 'No'}`,
            `**Tags:** ${details.tags?.join(', ') || 'None'}`,
            '',
            '### Stats',
            `- Favorites: ${details.favorite_count}`,
            `- Votes: ${details.vote_count}`,
            `- Copies: ${details.copy_count}`,
            '',
        ];
        // Signature
        if (details.signature) {
            if (details.signature.inputs?.length > 0) {
                lines.push('### Inputs');
                for (const input of details.signature.inputs) {
                    lines.push(`- **${input.name}** (${input.dataType}) - Node: ${input.nodeId}`);
                }
                lines.push('');
            }
            if (details.signature.outputs?.length > 0) {
                lines.push('### Outputs');
                for (const output of details.signature.outputs) {
                    lines.push(`- **${output.name}** (${output.dataType}) - Node: ${output.nodeType}`);
                }
                lines.push('');
            }
            if (details.signature.settings?.length > 0) {
                lines.push('### Settings');
                for (const setting of details.signature.settings) {
                    lines.push(`- **${setting.name}** (${setting.type}): ${JSON.stringify(setting.currentValue)}`);
                }
                lines.push('');
            }
            if (details.signature.usage_notes?.length > 0) {
                lines.push('### Usage Notes');
                for (const note of details.signature.usage_notes) {
                    lines.push(`- ${note}`);
                }
            }
        }
        // Node count
        const nodeCount = details.nodes ? Object.keys(details.nodes).length : 0;
        const connectionCount = details.connections ? Object.keys(details.connections).length : 0;
        lines.push('', `**Nodes:** ${nodeCount} | **Connections:** ${connectionCount}`);
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting workflow details: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-workflow-details.js.map