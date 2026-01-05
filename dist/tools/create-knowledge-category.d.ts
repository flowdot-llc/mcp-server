/**
 * Create Knowledge Category Tool
 *
 * Creates a new document category in the knowledge base.
 * Can create personal categories or team categories.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const createKnowledgeCategoryToolDef: Tool;
export declare function handleCreateKnowledgeCategory(api: FlowDotApiClient, args: {
    name: string;
    description?: string;
    color?: string;
    team_id?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=create-knowledge-category.d.ts.map