/**
 * create_app Tool
 *
 * Create a new FlowDot app.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const createAppTool: Tool;
export declare function handleCreateApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=create-app.d.ts.map