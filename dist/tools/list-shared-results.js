/**
 * list_shared_results MCP Tool
 *
 * Lists shared execution results for a workflow.
 */
export const listSharedResultsTool = {
    name: 'list_shared_results',
    description: 'List all shared execution results for a workflow. Shows shareable links, view counts, and metadata for each shared result.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            sort: {
                type: 'string',
                enum: ['newest', 'oldest', 'most_viewed'],
                description: 'Sort order for results (default: newest)',
            },
            limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 20, max: 100)',
            },
            page: {
                type: 'number',
                description: 'Page number for pagination (default: 1)',
            },
        },
        required: ['workflow_id'],
    },
};
function formatSharedResult(result) {
    const lines = [
        `### ${result.title || 'Untitled Result'} (${result.hash})`,
        '',
        `**Share URL:** ${result.share_url}`,
        `**Views:** ${result.view_count} | **Votes:** ${result.vote_count}`,
        `**Status:** ${result.is_active ? '✓ Active' : '✗ Inactive'}`,
        `**Created:** ${result.created_at}`,
    ];
    if (result.description) {
        lines.push(`**Description:** ${result.description}`);
    }
    if (result.expires_at) {
        lines.push(`**Expires:** ${result.expires_at}`);
    }
    if (result.preset_hash) {
        lines.push(`**Preset:** ${result.preset_hash}`);
    }
    return lines.join('\n');
}
export async function handleListSharedResults(api, args) {
    try {
        const result = await api.listSharedResults(args.workflow_id, {
            sort: args.sort,
            limit: args.limit,
            page: args.page,
        });
        const sharedResults = result.data || [];
        if (sharedResults.length === 0) {
            return {
                content: [{ type: 'text', text: 'No shared results found for this workflow.\n\nTip: Use `create_shared_result` to share an execution result.' }],
            };
        }
        const formatted = sharedResults.map(formatSharedResult).join('\n\n---\n\n');
        const header = `## Shared Results (${result.total} total, page ${result.current_page}/${result.last_page})\n\n`;
        return {
            content: [{ type: 'text', text: header + formatted }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error listing shared results: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=list-shared-results.js.map