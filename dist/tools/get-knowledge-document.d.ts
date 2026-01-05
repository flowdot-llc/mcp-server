/**
 * Get Knowledge Document Tool
 *
 * Gets detailed information about a specific document.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getKnowledgeDocumentToolDef: Tool;
export declare function handleGetKnowledgeDocument(api: FlowDotApiClient, args: {
    document_id: number | string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-knowledge-document.d.ts.map