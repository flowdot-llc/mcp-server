/**
 * get_workflow_public_url MCP Tool
 *
 * Gets the public URL for a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowPublicUrlTool: Tool;
export declare function handleGetWorkflowPublicUrl(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-public-url.d.ts.map