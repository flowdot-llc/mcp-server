/**
 * Upload Text Document Tool
 *
 * Uploads text content directly as a document to the knowledge base.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const uploadTextDocumentToolDef: Tool;
export declare function handleUploadTextDocument(api: FlowDotApiClient, args: {
    title: string;
    content: string;
    category_id?: number;
    mime_type?: 'text/plain' | 'text/markdown' | 'application/json';
}): Promise<CallToolResult>;
//# sourceMappingURL=upload-text-document.d.ts.map