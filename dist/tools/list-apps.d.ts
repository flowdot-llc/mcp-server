/**
 * list_apps Tool
 *
 * Lists the user's own apps with optional filtering.
 * Required scope: apps:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listAppsTool: Tool;
export declare function handleListApps(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=list-apps.d.ts.map