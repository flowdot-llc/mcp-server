/**
 * delete_custom_node MCP Tool
 *
 * Delete a custom node.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteCustomNodeTool: Tool;
export declare function handleDeleteCustomNode(api: FlowDotApiClient, args: {
    node_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-custom-node.d.ts.map