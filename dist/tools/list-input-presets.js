/**
 * list_input_presets MCP Tool
 *
 * Lists input presets (community inputs) for a workflow.
 */
export const listInputPresetsTool = {
    name: 'list_input_presets',
    description: 'List input presets (community inputs) for a workflow. These are pre-configured input values that users can share with others.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash)',
            },
            sort: {
                type: 'string',
                enum: ['popular', 'newest', 'oldest', 'most_used'],
                description: 'Sort order for results (default: popular)',
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
function formatPreset(preset) {
    const lines = [
        `### ${preset.title} (${preset.hash})`,
        '',
        `**URL:** ${preset.public_url}`,
        `**Votes:** ${preset.vote_count} | **Uses:** ${preset.usage_count}`,
    ];
    if (preset.description) {
        lines.push(`**Description:** ${preset.description}`);
    }
    if (preset.user) {
        lines.push(`**Created by:** ${preset.user.name}`);
    }
    lines.push(`**Created:** ${preset.created_at}`);
    // Show input values (summarized)
    if (preset.inputs && Object.keys(preset.inputs).length > 0) {
        lines.push('', '**Inputs:**');
        for (const [key, value] of Object.entries(preset.inputs)) {
            const summary = typeof value === 'object'
                ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                : String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '');
            lines.push(`- **${key}:** ${summary}`);
        }
    }
    return lines.join('\n');
}
export async function handleListInputPresets(api, args) {
    try {
        const result = await api.listInputPresets(args.workflow_id, {
            sort: args.sort,
            limit: args.limit,
            page: args.page,
        });
        if (!result.community_inputs_enabled) {
            return {
                content: [{
                        type: 'text',
                        text: 'Community inputs are not enabled for this workflow.\n\nThe workflow owner can enable this feature in workflow settings.',
                    }],
            };
        }
        const presets = result.data || [];
        if (presets.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: 'No input presets found for this workflow.\n\nTip: Use `create_input_preset` to create the first community input preset.',
                    }],
            };
        }
        const formatted = presets.map(formatPreset).join('\n\n---\n\n');
        const pagination = result.total
            ? ` (${result.total} total, page ${result.current_page}/${result.last_page})`
            : '';
        const header = `## Input Presets${pagination}\n\n`;
        return {
            content: [{ type: 'text', text: header + formatted }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error listing input presets: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=list-input-presets.js.map