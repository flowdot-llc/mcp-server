/**
 * add_workflow_comment MCP Tool
 *
 * Adds a comment to a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const addWorkflowCommentTool: Tool;
export declare function handleAddWorkflowComment(api: FlowDotApiClient, args: {
    workflow_id: string;
    content: string;
    parent_id?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=add-workflow-comment.d.ts.map