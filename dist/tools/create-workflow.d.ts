/**
 * create_workflow MCP Tool
 *
 * Creates a new empty workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const createWorkflowTool: Tool;
export declare function handleCreateWorkflow(api: FlowDotApiClient, args: {
    name: string;
    description?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=create-workflow.d.ts.map