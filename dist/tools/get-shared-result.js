/**
 * get_shared_result MCP Tool
 *
 * Gets details of a specific shared execution result.
 */
export const getSharedResultTool = {
    name: 'get_shared_result',
    description: 'Get detailed information about a specific shared execution result, including the shared outputs and inputs.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            result_hash: {
                type: 'string',
                description: 'The shared result hash',
            },
        },
        required: ['workflow_id', 'result_hash'],
    },
};
export async function handleGetSharedResult(api, args) {
    try {
        const result = await api.getSharedResult(args.workflow_id, args.result_hash);
        const lines = [
            `## ${result.title || 'Untitled Result'}`,
            '',
            `**Hash:** ${result.hash}`,
            `**Share URL:** ${result.share_url}`,
            `**Views:** ${result.view_count} | **Votes:** ${result.vote_count}`,
            `**Status:** ${result.is_active ? '✓ Active' : '✗ Inactive'}`,
            `**Created:** ${result.created_at}`,
        ];
        if (result.description) {
            lines.push('', `**Description:** ${result.description}`);
        }
        if (result.expires_at) {
            lines.push(`**Expires:** ${result.expires_at}`);
        }
        if (result.workflow) {
            lines.push('', '### Workflow');
            lines.push(`- **Name:** ${result.workflow.name}`);
            lines.push(`- **Hash:** ${result.workflow.hash}`);
            if (result.workflow.description) {
                lines.push(`- **Description:** ${result.workflow.description}`);
            }
        }
        if (result.user) {
            lines.push('', `**Shared by:** ${result.user.name} (${result.user.hash})`);
        }
        // Show shared inputs
        if (result.shared_inputs && Object.keys(result.shared_inputs).length > 0) {
            lines.push('', '### Shared Inputs');
            lines.push('```json');
            lines.push(JSON.stringify(result.shared_inputs, null, 2));
            lines.push('```');
        }
        // Show shared outputs (summarized)
        if (result.shared_node_results && Object.keys(result.shared_node_results).length > 0) {
            const nodeCount = Object.keys(result.shared_node_results).length;
            lines.push('', `### Shared Outputs (${nodeCount} nodes)`);
            for (const [nodeId, nodeResult] of Object.entries(result.shared_node_results)) {
                const summary = typeof nodeResult === 'object'
                    ? JSON.stringify(nodeResult).substring(0, 200) + '...'
                    : String(nodeResult).substring(0, 200);
                lines.push(`- **${nodeId}:** ${summary}`);
            }
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting shared result: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-shared-result.js.map