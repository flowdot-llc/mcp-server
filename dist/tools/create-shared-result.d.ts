/**
 * create_shared_result MCP Tool
 *
 * Creates a shareable link for a workflow execution result.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const createSharedResultTool: Tool;
export declare function handleCreateSharedResult(api: FlowDotApiClient, args: {
    workflow_id: string;
    execution_id: string;
    title?: string;
    description?: string;
    preset_hash?: string;
    expires_in_days?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=create-shared-result.d.ts.map