/**
 * get_execution_history MCP Tool
 *
 * Gets past execution history for a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getExecutionHistoryTool: Tool;
export declare function handleGetExecutionHistory(api: FlowDotApiClient, args: {
    workflow_id: string;
    page?: number;
    limit?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-execution-history.d.ts.map