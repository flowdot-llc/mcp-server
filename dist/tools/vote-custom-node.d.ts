/**
 * vote_custom_node MCP Tool
 *
 * Vote on a custom node (upvote, downvote, or remove vote).
 * Scope: custom_nodes:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const voteCustomNodeTool: Tool;
export declare function handleVoteCustomNode(api: FlowDotApiClient, args: {
    node_id: string;
    vote: 'up' | 'down' | 'remove';
}): Promise<CallToolResult>;
//# sourceMappingURL=vote-custom-node.d.ts.map