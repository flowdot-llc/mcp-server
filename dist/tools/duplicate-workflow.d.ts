/**
 * duplicate_workflow MCP Tool
 *
 * Duplicates/clones an existing workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const duplicateWorkflowTool: Tool;
export declare function handleDuplicateWorkflow(api: FlowDotApiClient, args: {
    workflow_id: string;
    name?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=duplicate-workflow.d.ts.map