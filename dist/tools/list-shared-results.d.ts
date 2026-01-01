/**
 * list_shared_results MCP Tool
 *
 * Lists shared execution results for a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listSharedResultsTool: Tool;
export declare function handleListSharedResults(api: FlowDotApiClient, args: {
    workflow_id: string;
    sort?: string;
    limit?: number;
    page?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=list-shared-results.d.ts.map