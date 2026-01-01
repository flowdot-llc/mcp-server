/**
 * delete_node MCP Tool
 *
 * Deletes a node from a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteNodeTool: Tool;
export declare function handleDeleteNode(api: FlowDotApiClient, args: {
    workflow_id: string;
    node_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-node.d.ts.map