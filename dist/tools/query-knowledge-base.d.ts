/**
 * Query Knowledge Base Tool
 *
 * Performs RAG queries against the knowledge base to retrieve relevant document chunks.
 * Supports filtering by team and controlling which document sources to include.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const queryKnowledgeBaseToolDef: Tool;
export declare function handleQueryKnowledgeBase(api: FlowDotApiClient, args: {
    query: string;
    category_id?: number;
    team_id?: number;
    include_personal?: boolean;
    include_team?: boolean;
    top_k?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=query-knowledge-base.d.ts.map