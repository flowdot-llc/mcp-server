/**
 * list_input_presets MCP Tool
 *
 * Lists input presets (community inputs) for a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const listInputPresetsTool: Tool;
export declare function handleListInputPresets(api: FlowDotApiClient, args: {
    workflow_id: string;
    sort?: string;
    limit?: number;
    page?: number;
}): Promise<CallToolResult>;
//# sourceMappingURL=list-input-presets.d.ts.map