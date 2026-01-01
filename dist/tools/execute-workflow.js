/**
 * execute_workflow MCP Tool
 *
 * Executes a FlowDot workflow.
 */
export const executeWorkflowTool = {
    name: 'execute_workflow',
    description: 'Execute a FlowDot workflow by ID. Use list_workflows first to get available workflow IDs.',
    inputSchema: {
        type: 'object',
        properties: {
            workflow_id: {
                type: 'string',
                description: 'The workflow ID (hash) to execute',
            },
            inputs: {
                type: 'object',
                description: 'Input values for the workflow. Check workflow input schema for required fields.',
                additionalProperties: true,
            },
            wait_for_completion: {
                type: 'boolean',
                default: true,
                description: 'Wait for the workflow to complete before returning. Set to false for async execution.',
            },
            mode: {
                type: 'string',
                enum: ['flowdot', 'simple', 'capable', 'complex'],
                description: 'LLM mode for custom nodes: flowdot (default, cost-effective), simple (fast gpt-4o-mini), capable (balanced gpt-4o), complex (powerful claude-3.5-sonnet)',
                default: 'flowdot',
            },
        },
        required: ['workflow_id'],
    },
};
export async function handleExecuteWorkflow(api, args) {
    try {
        const result = await api.executeWorkflow(args.workflow_id, args.inputs || {}, args.wait_for_completion ?? true, args.mode || 'flowdot');
        // Handle async execution (not waiting for completion)
        if (result.status === 'started' && result.message) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Workflow execution started.\n\nExecution ID: ${result.execution_id}\n\n${result.message}`,
                    },
                ],
            };
        }
        // Handle completed execution with enhanced output formatting
        const lines = [
            'Workflow executed successfully.',
            '',
            `**Execution ID:** ${result.execution_id}`,
            `**Status:** ${result.status}`,
        ];
        if (result.outputs && typeof result.outputs === 'object' && Object.keys(result.outputs).length > 0) {
            lines.push('');
            lines.push('## Outputs');
            lines.push('```json');
            lines.push(JSON.stringify(result.outputs, null, 2));
            lines.push('```');
            // Add individual output values for easy reading
            lines.push('');
            lines.push('## Output Values');
            for (const [key, val] of Object.entries(result.outputs)) {
                let displayVal;
                if (val === null) {
                    displayVal = 'null';
                }
                else if (typeof val === 'object') {
                    displayVal = JSON.stringify(val);
                }
                else {
                    displayVal = String(val);
                }
                // Truncate very long values for readability
                if (displayVal.length > 500) {
                    displayVal = displayVal.substring(0, 500) + '... (truncated)';
                }
                lines.push(`- **${key}**: ${displayVal}`);
            }
        }
        else if (result.outputs) {
            // Handle non-object outputs (string, number, etc.)
            lines.push('');
            lines.push('## Output');
            lines.push(`\`\`\`\n${String(result.outputs)}\n\`\`\``);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: lines.join('\n'),
                },
            ],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing workflow: ${message}`,
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=execute-workflow.js.map