/**
 * Delete Knowledge Category Tool
 *
 * Deletes a document category. Documents in the category become uncategorized.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteKnowledgeCategoryToolDef: Tool;
export declare function handleDeleteKnowledgeCategory(api: FlowDotApiClient, args: {
    category_id: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-knowledge-category.d.ts.map