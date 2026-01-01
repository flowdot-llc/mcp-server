/**
 * cancel_execution MCP Tool
 *
 * Cancels a running workflow execution.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const cancelExecutionTool: Tool;
export declare function handleCancelExecution(api: FlowDotApiClient, args: {
    execution_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=cancel-execution.d.ts.map