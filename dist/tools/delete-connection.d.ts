/**
 * delete_connection MCP Tool
 *
 * Deletes a connection from a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteConnectionTool: Tool;
export declare function handleDeleteConnection(api: FlowDotApiClient, args: {
    workflow_id: string;
    connection_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-connection.d.ts.map