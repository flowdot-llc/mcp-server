/**
 * Reprocess Document Tool
 *
 * Reprocesses a failed or pending document.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const reprocessDocumentToolDef: Tool;
export declare function handleReprocessDocument(api: FlowDotApiClient, args: {
    document_id: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=reprocess-document.d.ts.map