/**
 * Move Document to Category Tool
 *
 * Moves a document to a different category.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const moveDocumentToCategoryToolDef: Tool;
export declare function handleMoveDocumentToCategory(api: FlowDotApiClient, args: {
    document_id: number;
    category_id?: number | null;
}): Promise<CallToolResult>;
//# sourceMappingURL=move-document-to-category.d.ts.map