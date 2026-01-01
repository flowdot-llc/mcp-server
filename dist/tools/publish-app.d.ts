/**
 * publish_app Tool
 *
 * Publish an app to make it publicly visible.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const publishAppTool: Tool;
export declare function handlePublishApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=publish-app.d.ts.map