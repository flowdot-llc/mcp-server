/**
 * delete_workflow MCP Tool
 *
 * Deletes a workflow permanently.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteWorkflowTool: Tool;
export declare function handleDeleteWorkflow(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-workflow.d.ts.map