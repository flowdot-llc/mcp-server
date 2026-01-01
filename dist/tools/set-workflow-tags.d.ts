/**
 * set_workflow_tags MCP Tool
 *
 * Sets/updates the tags on a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const setWorkflowTagsTool: Tool;
export declare function handleSetWorkflowTags(api: FlowDotApiClient, args: {
    workflow_id: string;
    tags: string[];
}): Promise<CallToolResult>;
//# sourceMappingURL=set-workflow-tags.d.ts.map