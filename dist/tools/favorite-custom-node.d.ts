/**
 * favorite_custom_node MCP Tool
 *
 * Add or remove a custom node from favorites.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const favoriteCustomNodeTool: Tool;
export declare function handleFavoriteCustomNode(api: FlowDotApiClient, args: {
    node_id: string;
    favorite?: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=favorite-custom-node.d.ts.map