/**
 * search_workflows MCP Tool
 *
 * Searches workflows by name, description, or tags.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const searchWorkflowsTool: Tool;
export declare function handleSearchWorkflows(api: FlowDotApiClient, args: {
    query: string;
    tags?: string[];
    page?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=search-workflows.d.ts.map