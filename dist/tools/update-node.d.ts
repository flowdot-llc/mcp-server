/**
 * update_node MCP Tool
 *
 * Updates a node's position or properties.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const updateNodeTool: Tool;
export declare function handleUpdateNode(api: FlowDotApiClient, args: {
    workflow_id: string;
    node_id: string;
    position?: {
        x: number;
        y: number;
    };
    properties?: Record<string, unknown>;
}): Promise<CallToolResult>;
//# sourceMappingURL=update-node.d.ts.map