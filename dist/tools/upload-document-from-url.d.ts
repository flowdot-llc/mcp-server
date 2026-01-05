/**
 * Upload Document from URL Tool
 *
 * Downloads and uploads a document from a URL to the knowledge base.
 * Can upload to personal or team knowledge base.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const uploadDocumentFromUrlToolDef: Tool;
export declare function handleUploadDocumentFromUrl(api: FlowDotApiClient, args: {
    url: string;
    title?: string;
    category_id?: number;
    team_id?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=upload-document-from-url.d.ts.map