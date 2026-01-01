/**
 * get_execution_status MCP Tool
 *
 * Gets the status and results of a workflow execution.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getExecutionTool: Tool;
export declare function handleGetExecution(api: FlowDotApiClient, args: {
    execution_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-execution.d.ts.map