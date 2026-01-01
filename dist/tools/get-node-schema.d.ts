/**
 * get_node_schema MCP Tool
 *
 * Gets the full schema for a specific node type.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getNodeSchemaTool: Tool;
export declare function handleGetNodeSchema(api: FlowDotApiClient, args: {
    node_type: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-node-schema.d.ts.map