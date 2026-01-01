/**
 * get_custom_node_comments MCP Tool
 *
 * Get comments and ratings for a custom node.
 * Scope: custom_nodes:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getCustomNodeCommentsTool: Tool;
export declare function handleGetCustomNodeComments(api: FlowDotApiClient, args: {
    node_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-custom-node-comments.d.ts.map