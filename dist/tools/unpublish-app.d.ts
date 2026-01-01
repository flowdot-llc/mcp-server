/**
 * unpublish_app Tool
 *
 * Unpublish an app to make it private again.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const unpublishAppTool: Tool;
export declare function handleUnpublishApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=unpublish-app.d.ts.map