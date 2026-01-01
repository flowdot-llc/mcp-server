/**
 * get_shared_result_comments MCP Tool
 *
 * Gets comments on a shared execution result.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getSharedResultCommentsTool: Tool;
export declare function handleGetSharedResultComments(api: FlowDotApiClient, args: {
    workflow_id: string;
    result_hash: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-shared-result-comments.d.ts.map