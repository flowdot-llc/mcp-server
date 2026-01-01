/**
 * get_shared_result MCP Tool
 *
 * Gets details of a specific shared execution result.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getSharedResultTool: Tool;
export declare function handleGetSharedResult(api: FlowDotApiClient, args: {
    workflow_id: string;
    result_hash: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-shared-result.d.ts.map