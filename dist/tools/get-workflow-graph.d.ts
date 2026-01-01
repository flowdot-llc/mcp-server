/**
 * get_workflow_graph MCP Tool
 *
 * Gets the full node and connection graph of a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowGraphTool: Tool;
export declare function handleGetWorkflowGraph(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-graph.d.ts.map