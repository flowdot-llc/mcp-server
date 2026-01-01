/**
 * retry_execution MCP Tool
 *
 * Retries a failed workflow execution with the same inputs.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const retryExecutionTool: Tool;
export declare function handleRetryExecution(api: FlowDotApiClient, args: {
    execution_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=retry-execution.d.ts.map