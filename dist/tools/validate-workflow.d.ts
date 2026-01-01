/**
 * validate_workflow MCP Tool
 *
 * Validates a workflow for errors and warnings.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const validateWorkflowTool: Tool;
export declare function handleValidateWorkflow(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=validate-workflow.d.ts.map