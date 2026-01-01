/**
 * list_workflows MCP Tool
 *
 * Lists workflows available to the user.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listWorkflowsTool: Tool;
export declare function handleListWorkflows(api: FlowDotApiClient, args: {
    filter?: string;
    favorites_only?: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=list-workflows.d.ts.map