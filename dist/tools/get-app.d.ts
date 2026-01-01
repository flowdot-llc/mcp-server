/**
 * get_app Tool
 *
 * Get detailed information about a specific app including its code.
 * Required scope: apps:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getAppTool: Tool;
export declare function handleGetApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=get-app.d.ts.map