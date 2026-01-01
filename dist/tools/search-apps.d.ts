/**
 * search_apps Tool
 *
 * Search public apps by name, description, category, or tags.
 * Required scope: apps:read
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const searchAppsTool: Tool;
export declare function handleSearchApps(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=search-apps.d.ts.map