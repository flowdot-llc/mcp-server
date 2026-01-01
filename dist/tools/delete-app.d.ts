/**
 * delete_app Tool
 *
 * Delete an app permanently.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteAppTool: Tool;
export declare function handleDeleteApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=delete-app.d.ts.map