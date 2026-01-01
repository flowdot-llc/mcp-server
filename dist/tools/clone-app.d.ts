/**
 * clone_app Tool
 *
 * Clone a public app to your library.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const cloneAppTool: Tool;
export declare function handleCloneApp(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=clone-app.d.ts.map