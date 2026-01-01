/**
 * get_custom_node MCP Tool
 *
 * Get detailed information about a custom node including its script code.
 * Scope: custom_nodes:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getCustomNodeTool: Tool;
export declare function handleGetCustomNode(api: FlowDotApiClient, args: {
    node_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-custom-node.d.ts.map