/**
 * vote_shared_result MCP Tool
 *
 * Votes on a shared execution result.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const voteSharedResultTool: Tool;
export declare function handleVoteSharedResult(api: FlowDotApiClient, args: {
    workflow_id: string;
    result_hash: string;
    vote: 'up' | 'down' | 'remove';
}): Promise<CallToolResult>;
//# sourceMappingURL=vote-shared-result.d.ts.map