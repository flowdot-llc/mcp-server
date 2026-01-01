/**
 * add_node MCP Tool
 *
 * Adds a new node to a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const addNodeTool: Tool;
export declare function handleAddNode(api: FlowDotApiClient, args: {
    workflow_id: string;
    node_type: string;
    position: {
        x: number;
        y: number;
    };
    properties?: Record<string, unknown>;
}): Promise<CallToolResult>;
//# sourceMappingURL=add-node.d.ts.map