/**
 * vote_workflow MCP Tool
 *
 * Votes on a workflow (upvote, downvote, or remove vote).
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const voteWorkflowTool: Tool;
export declare function handleVoteWorkflow(api: FlowDotApiClient, args: {
    workflow_id: string;
    vote: 'up' | 'down' | 'remove';
}): Promise<CallToolResult>;
//# sourceMappingURL=vote-workflow.d.ts.map