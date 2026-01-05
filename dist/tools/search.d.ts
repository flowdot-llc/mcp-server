/**
 * search MCP Tool
 *
 * A general-purpose search tool for FlowDot resources.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const searchTool: Tool;
export declare function handleSearch(api: FlowDotApiClient, args: {
    query: string;
    type?: 'workflow' | 'app' | 'custom_node';
    page?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=search.d.ts.map