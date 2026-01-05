/**
 * Update Knowledge Category Tool
 *
 * Updates an existing document category.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const updateKnowledgeCategoryToolDef: Tool;
export declare function handleUpdateKnowledgeCategory(api: FlowDotApiClient, args: {
    category_id: number;
    name?: string;
    description?: string;
    color?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=update-knowledge-category.d.ts.map