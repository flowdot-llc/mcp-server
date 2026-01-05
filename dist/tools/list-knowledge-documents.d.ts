/**
 * List Knowledge Documents Tool
 *
 * Lists documents in the user's knowledge base with optional filtering.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listKnowledgeDocumentsToolDef: Tool;
export declare function handleListKnowledgeDocuments(api: FlowDotApiClient, args: {
    category_id?: number;
    status?: 'pending' | 'processing' | 'ready' | 'failed';
}): Promise<CallToolResult>;
//# sourceMappingURL=list-knowledge-documents.d.ts.map