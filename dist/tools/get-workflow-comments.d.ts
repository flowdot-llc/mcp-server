/**
 * get_workflow_comments MCP Tool
 *
 * Gets user comments on a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowCommentsTool: Tool;
export declare function handleGetWorkflowComments(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-comments.d.ts.map