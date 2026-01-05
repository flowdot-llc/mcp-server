/**
 * Transfer Document Ownership Tool
 *
 * Transfers a document between personal and team knowledge bases.
 * Can also optionally change the category during transfer.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const transferDocumentOwnershipToolDef: Tool;
export declare function handleTransferDocumentOwnership(api: FlowDotApiClient, args: {
    document_id: number;
    team_id?: number | null;
    category_id?: number | null;
}): Promise<CallToolResult>;
//# sourceMappingURL=transfer-document-ownership.d.ts.map