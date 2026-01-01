/**
 * list_available_nodes MCP Tool
 *
 * Lists all available node types that can be added to workflows.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listAvailableNodesTool: Tool;
export declare function handleListAvailableNodes(api: FlowDotApiClient, _args: Record<string, never>): Promise<CallToolResult>;
//# sourceMappingURL=list-available-nodes.d.ts.map