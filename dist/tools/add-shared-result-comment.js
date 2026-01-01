/**
 * add_shared_result_comment MCP Tool
 *
 * Adds a comment to a shared execution result.
 */
export const addSharedResultCommentTool = {
    name: 'add_shared_result_comment',
    description: 'Add a comment to a shared execution result.',
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
            content: {
                type: 'string',
                description: 'The comment content (max 2000 characters)',
            },
            parent_id: {
                type: 'number',
                description: 'Optional parent comment ID for replies',
            },
        },
        required: ['workflow_id', 'result_hash', 'content'],
    },
};
export async function handleAddSharedResultComment(api, args) {
    try {
        // Validate content length
        if (!args.content || args.content.trim().length === 0) {
            return {
                content: [{ type: 'text', text: 'Error: Comment content cannot be empty.' }],
                isError: true,
            };
        }
        if (args.content.length > 2000) {
            return {
                content: [{ type: 'text', text: 'Error: Comment content exceeds maximum length of 2000 characters.' }],
                isError: true,
            };
        }
        const result = await api.addSharedResultComment(args.workflow_id, args.result_hash, args.content, args.parent_id);
        const isReply = args.parent_id ? ' (reply)' : '';
        const lines = [
            `## Comment Added Successfully${isReply}`,
            '',
            `**Comment ID:** ${result.id}`,
            `**By:** ${result.user_name}`,
            `**Posted:** ${result.created_at}`,
            '',
            '> ' + result.content.split('\n').join('\n> '),
        ];
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error adding comment: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=add-shared-result-comment.js.map