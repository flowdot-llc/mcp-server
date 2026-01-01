/**
 * get_workflow_details MCP Tool
 *
 * Gets detailed workflow information including nodes, connections, and signature.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowDetailsTool: Tool;
export declare function handleGetWorkflowDetails(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-details.d.ts.map