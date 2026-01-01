/**
 * get_workflow_inputs_schema MCP Tool
 *
 * Gets the input schema for a workflow - what inputs it expects.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowInputsSchemaTool: Tool;
export declare function handleGetWorkflowInputsSchema(api: FlowDotApiClient, args: {
    workflow_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-inputs-schema.d.ts.map