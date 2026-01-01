/**
 * validate_workflow MCP Tool
 *
 * Validates a workflow for errors and warnings.
 */
export const validateWorkflowTool = {
    name: 'validate_workflow',
    description: 'Validate a workflow for errors such as missing connections, invalid configurations, or disconnected nodes.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash) to validate',
            },
        },
        required: ['workflow_id'],
    },
};
export async function handleValidateWorkflow(api, args) {
    try {
        const result = await api.validateWorkflow(args.workflow_id);
        const lines = ['## Workflow Validation'];
        if (result.valid) {
            lines.push('', '**Status: VALID**', '', 'The workflow is ready to execute.');
        }
        else {
            lines.push('', '**Status: INVALID**');
        }
        // Errors
        if (result.errors && result.errors.length > 0) {
            lines.push('', '### Errors');
            for (const error of result.errors) {
                const nodeInfo = error.nodeId ? ` (Node: ${error.nodeId})` : '';
                lines.push(`- [${error.type}]${nodeInfo} ${error.message}`);
            }
        }
        // Warnings
        if (result.warnings && result.warnings.length > 0) {
            lines.push('', '### Warnings');
            for (const warning of result.warnings) {
                const nodeInfo = warning.nodeId ? ` (Node: ${warning.nodeId})` : '';
                lines.push(`- [${warning.type}]${nodeInfo} ${warning.message}`);
            }
        }
        if (result.valid && (!result.warnings || result.warnings.length === 0)) {
            lines.push('', 'No errors or warnings detected.');
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error validating workflow: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=validate-workflow.js.map