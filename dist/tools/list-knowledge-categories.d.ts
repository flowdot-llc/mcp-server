/**
 * List Knowledge Categories Tool
 *
 * Lists all document categories in the user's knowledge base.
 * Supports filtering by team or personal categories only.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listKnowledgeCategoriesToolDef: Tool;
export declare function handleListKnowledgeCategories(api: FlowDotApiClient, args?: {
    team_id?: number;
    personal?: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=list-knowledge-categories.d.ts.map