/**
 * search_public_custom_nodes MCP Tool
 *
 * Search public custom nodes shared by the community.
 * Scope: custom_nodes:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const searchPublicCustomNodesTool: Tool;
export declare function handleSearchPublicCustomNodes(api: FlowDotApiClient, args: {
    query?: string;
    category?: string;
    tags?: string[];
    verified_only?: boolean;
    sort?: string;
    limit?: number;
    page?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=search-public-custom-nodes.d.ts.map