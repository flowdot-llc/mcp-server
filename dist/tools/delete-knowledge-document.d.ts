/**
 * Delete Knowledge Document Tool
 *
 * Deletes a document from the knowledge base.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteKnowledgeDocumentToolDef: Tool;
export declare function handleDeleteKnowledgeDocument(api: FlowDotApiClient, args: {
    document_id: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-knowledge-document.d.ts.map