/**
 * get_workflow_tags MCP Tool
 *
 * Gets the tags associated with a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowTagsTool: Tool;
export declare function handleGetWorkflowTags(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-tags.d.ts.map