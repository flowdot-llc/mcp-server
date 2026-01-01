/**
 * get_node_connections MCP Tool
 *
 * Gets all connections for a specific node.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getNodeConnectionsTool: Tool;
export declare function handleGetNodeConnections(api: FlowDotApiClient, args: {
    workflow_id: string;
    node_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-node-connections.d.ts.map