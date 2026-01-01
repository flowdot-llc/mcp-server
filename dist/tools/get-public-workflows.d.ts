/**
 * get_public_workflows MCP Tool
 *
 * Gets public workflows from all users.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getPublicWorkflowsTool: Tool;
export declare function handleGetPublicWorkflows(api: FlowDotApiClient, args: {
    page?: number;
    sort_by?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-public-workflows.d.ts.map