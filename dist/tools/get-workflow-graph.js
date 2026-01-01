/**
 * get_workflow_graph MCP Tool
 *
 * Gets the full node and connection graph of a workflow.
 */
export const getWorkflowGraphTool = {
    name: 'get_workflow_graph',
    description: 'Get the complete graph structure of a workflow including all nodes and connections.',
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
export async function handleGetWorkflowGraph(api, args) {
    try {
        const graph = await api.getWorkflowGraph(args.workflow_id);
        const nodeCount = graph.nodes ? Object.keys(graph.nodes).length : 0;
        const connectionCount = graph.connections ? Object.keys(graph.connections).length : 0;
        const lines = [
            '## Workflow Graph',
            '',
            `**Nodes:** ${nodeCount}`,
            `**Connections:** ${connectionCount}`,
            '',
        ];
        // List nodes
        if (nodeCount > 0) {
            lines.push('### Nodes');
            for (const [id, node] of Object.entries(graph.nodes)) {
                lines.push(`- **${node.title}** (${id})`);
                lines.push(`  Type: ${node.type} | Position: (${node.position.x}, ${node.position.y})`);
                if (node.inputs && node.inputs.length > 0) {
                    lines.push(`  Inputs: ${node.inputs.map(i => i.name).join(', ')}`);
                }
                if (node.outputs && node.outputs.length > 0) {
                    lines.push(`  Outputs: ${node.outputs.map(o => o.name).join(', ')}`);
                }
                // Show properties info for debugging
                if (node.properties === null) {
                    lines.push(`  Properties: **null** (BUG!)`);
                }
                else if (node.properties === undefined) {
                    lines.push(`  Properties: **undefined** (BUG!)`);
                }
                else if (!Array.isArray(node.properties)) {
                    lines.push(`  Properties: **${typeof node.properties}** (BUG! Expected array, got: ${JSON.stringify(node.properties).substring(0, 100)})`);
                }
                else if (node.properties.length === 0) {
                    lines.push(`  Properties: [] (empty array)`);
                }
                else {
                    lines.push(`  Properties: [${node.properties.length} items] ${node.properties.map(p => p.key).join(', ')}`);
                }
            }
            lines.push('');
        }
        // List connections
        if (connectionCount > 0) {
            lines.push('### Connections');
            for (const [id, conn] of Object.entries(graph.connections)) {
                const feedback = conn.isFeedback ? ' (feedback)' : '';
                lines.push(`- ${conn.sourceNodeId}.${conn.sourceSocketId} -> ${conn.targetNodeId}.${conn.targetSocketId}${feedback}`);
            }
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            content: [{ type: 'text', text: `Error getting workflow graph: ${message}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-workflow-graph.js.map