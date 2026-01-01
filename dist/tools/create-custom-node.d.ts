/**
 * create_custom_node MCP Tool
 *
 * Create a new custom node with script code.
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CustomNodeSocket, CustomNodeProperty } from '../types.js';
export declare const createCustomNodeTool: Tool;
export declare function handleCreateCustomNode(api: FlowDotApiClient, args: {
    name: string;
    title: string;
    description: string;
    category?: string;
    version?: string;
    icon?: string;
    inputs: CustomNodeSocket[];
    outputs: CustomNodeSocket[];
    properties?: CustomNodeProperty[];
    script_code: string;
    execution_timeout?: number;
    memory_limit?: number;
    visibility?: 'private' | 'public' | 'unlisted';
    tags?: string[];
    llm_enabled?: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=create-custom-node.d.ts.map