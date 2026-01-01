/**
 * vote_input_preset MCP Tool
 *
 * Votes on an input preset.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const voteInputPresetTool: Tool;
export declare function handleVoteInputPreset(api: FlowDotApiClient, args: {
    workflow_id: string;
    preset_hash: string;
    vote: 'up' | 'down' | 'remove';
}): Promise<CallToolResult>;
//# sourceMappingURL=vote-input-preset.d.ts.map