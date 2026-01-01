/**
 * update_app Tool
 *
 * Update an existing FlowDot app.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const updateAppTool: Tool;
export declare function handleUpdateApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=update-app.d.ts.map