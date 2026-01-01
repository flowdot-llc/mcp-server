/**
 * create_workflow MCP Tool
 *
 * Creates a new empty workflow.
 */
export const createWorkflowTool = {
    name: 'create_workflow',
    description: 'Create a new empty workflow with a name and optional description. The workflow will be private by default.',
    inputSchema: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Name for the new workflow',
            },
            description: {
                type: 'string',
                description: 'Optional description of what the workflow does',
            },
        },
        required: ['name'],
    },
};
export async function handleCreateWorkflow(api, args) {
    try {
        const result = await api.createWorkflow(args.name, args.description);
        const lines = [
            '## Workflow Created Successfully',
            '',
            `**ID:** ${result.id}`,
            `**Name:** ${result.name}`,
            `**Description:** ${result.description || 'None'}`,
            `**Created:** ${result.created_at}`,
            '',
            'The workflow is empty and ready for nodes to be added.',
        ];
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error creating workflow: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=create-workflow.js.map