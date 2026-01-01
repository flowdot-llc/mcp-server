/**
 * favorite_workflow MCP Tool
 *
 * Favorites or unfavorites a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const favoriteWorkflowTool: Tool;
export declare function handleFavoriteWorkflow(api: FlowDotApiClient, args: {
    workflow_id: string;
    favorite: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=favorite-workflow.d.ts.map