/**
 * get_workflow_inputs_schema MCP Tool
 *
 * Gets the input schema for a workflow - what inputs it expects.
 */
export const getWorkflowInputsSchemaTool = {
    name: 'get_workflow_inputs_schema',
    description: 'Get the input schema for a workflow - shows what inputs are expected, their types, and whether they are required.',
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
export async function handleGetWorkflowInputsSchema(api, args) {
    try {
        const result = await api.getWorkflowInputsSchema(args.workflow_id);
        // API returns { workflow_id, inputs: [...], settings: [...], usage_notes: [...] }
        const inputs = Array.isArray(result?.inputs) ? result.inputs : [];
        const settings = Array.isArray(result?.settings) ? result.settings : [];
        const usageNotes = Array.isArray(result?.usage_notes) ? result.usage_notes : [];
        if (inputs.length === 0 && settings.length === 0) {
            return {
                content: [{ type: 'text', text: 'This workflow has no defined inputs or configurable settings.' }],
            };
        }
        const lines = ['## Workflow Input Schema', ''];
        if (inputs.length > 0) {
            lines.push('### Inputs');
            for (const input of inputs) {
                const required = input.required ? '(required)' : '(optional)';
                lines.push(`#### ${input.name} ${required}`);
                lines.push(`- **Type:** ${input.type || 'text'}`);
                if (input.description) {
                    lines.push(`- **Description:** ${input.description}`);
                }
                if (input.default !== undefined) {
                    lines.push(`- **Default:** ${JSON.stringify(input.default)}`);
                }
                lines.push('');
            }
        }
        if (settings.length > 0) {
            lines.push('### Settings');
            for (const setting of settings) {
                lines.push(`- **${setting.name}:** ${setting.description || setting.type || 'configurable'}`);
            }
            lines.push('');
        }
        if (usageNotes.length > 0) {
            lines.push('### Usage Notes');
            for (const note of usageNotes) {
                lines.push(`- ${note}`);
            }
            lines.push('');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting workflow inputs schema: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-workflow-inputs-schema.js.map