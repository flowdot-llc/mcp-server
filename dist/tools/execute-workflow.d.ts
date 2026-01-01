/**
 * execute_workflow MCP Tool
 *
 * Executes a FlowDot workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const executeWorkflowTool: Tool;
export declare function handleExecuteWorkflow(api: FlowDotApiClient, args: {
    workflow_id: string;
    inputs?: Record<string, unknown>;
    wait_for_completion?: boolean;
    mode?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=execute-workflow.d.ts.map