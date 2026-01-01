/**
 * update_custom_node MCP Tool
 *
 * Update an existing custom node.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CustomNodeSocket, CustomNodeProperty } from '../types.js';
export declare const updateCustomNodeTool: Tool;
export declare function handleUpdateCustomNode(api: FlowDotApiClient, args: {
    node_id: string;
    name?: string;
    title?: string;
    description?: string;
    category?: string;
    version?: string;
    icon?: string;
    inputs?: CustomNodeSocket[];
    outputs?: CustomNodeSocket[];
    properties?: CustomNodeProperty[];
    script_code?: string;
    execution_timeout?: number;
    memory_limit?: number;
    tags?: string[];
    llm_enabled?: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=update-custom-node.d.ts.map