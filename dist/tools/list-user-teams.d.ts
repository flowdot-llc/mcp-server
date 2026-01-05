/**
 * List User Teams Tool
 *
 * Lists all teams the user belongs to, including owned teams and member teams.
 * Use this to discover available teams before filtering knowledge base operations.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listUserTeamsToolDef: Tool;
export declare function handleListUserTeams(api: FlowDotApiClient): Promise<CallToolResult>;
//# sourceMappingURL=list-user-teams.d.ts.map