/**
 * add_shared_result_comment MCP Tool
 *
 * Adds a comment to a shared execution result.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const addSharedResultCommentTool: Tool;
export declare function handleAddSharedResultComment(api: FlowDotApiClient, args: {
    workflow_id: string;
    result_hash: string;
    content: string;
    parent_id?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=add-shared-result-comment.d.ts.map