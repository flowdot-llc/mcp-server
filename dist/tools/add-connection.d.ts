/**
 * add_connection MCP Tool
 *
 * Adds a connection between two nodes.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const addConnectionTool: Tool;
export declare function handleAddConnection(api: FlowDotApiClient, args: {
    workflow_id: string;
    source_node_id: string;
    source_socket_id: string;
    target_node_id: string;
    target_socket_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=add-connection.d.ts.map