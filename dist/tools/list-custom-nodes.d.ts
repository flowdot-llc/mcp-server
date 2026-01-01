/**
 * list_custom_nodes MCP Tool
 *
 * Lists the user's own custom nodes with optional search and category filtering.
 * Scope: custom_nodes:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listCustomNodesTool: Tool;
export declare function handleListCustomNodes(api: FlowDotApiClient, args: {
    search?: string;
    category?: string;
    limit?: number;
    page?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=list-custom-nodes.d.ts.map