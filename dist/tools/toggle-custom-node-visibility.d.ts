/**
 * toggle_custom_node_visibility MCP Tool
 *
 * Change the visibility of a custom node.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const toggleCustomNodeVisibilityTool: Tool;
export declare function handleToggleCustomNodeVisibility(api: FlowDotApiClient, args: {
    node_id: string;
    visibility?: 'private' | 'public' | 'unlisted';
}): Promise<CallToolResult>;
//# sourceMappingURL=toggle-custom-node-visibility.d.ts.map