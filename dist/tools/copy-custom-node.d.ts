/**
 * copy_custom_node MCP Tool
 *
 * Copy a public custom node to your library.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const copyCustomNodeTool: Tool;
export declare function handleCopyCustomNode(api: FlowDotApiClient, args: {
    node_id: string;
    name?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=copy-custom-node.d.ts.map