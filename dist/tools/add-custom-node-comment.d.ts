/**
 * add_custom_node_comment MCP Tool
 *
 * Add a comment to a custom node.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const addCustomNodeCommentTool: Tool;
export declare function handleAddCustomNodeComment(api: FlowDotApiClient, args: {
    node_id: string;
    content: string;
    parent_id?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=add-custom-node-comment.d.ts.map