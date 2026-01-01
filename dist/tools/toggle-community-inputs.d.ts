/**
 * toggle_community_inputs MCP Tool
 *
 * Enables or disables community inputs (input presets) for a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const toggleCommunityInputsTool: Tool;
export declare function handleToggleCommunityInputs(api: FlowDotApiClient, args: {
    workflow_id: string;
    enabled: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=toggle-community-inputs.d.ts.map