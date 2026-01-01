/**
 * stream_execution MCP Tool
 *
 * Provides SSE stream URL for real-time execution progress.
 * Note: MCP doesn't support true streaming, so this returns connection info.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const streamExecutionTool: Tool;
export declare function handleStreamExecution(api: FlowDotApiClient, args: {
    execution_id: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=stream-execution.d.ts.map