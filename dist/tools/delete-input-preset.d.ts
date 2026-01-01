/**
 * delete_input_preset MCP Tool
 *
 * Deletes an input preset.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const deleteInputPresetTool: Tool;
export declare function handleDeleteInputPreset(api: FlowDotApiClient, args: {
    workflow_id: string;
    preset_hash: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=delete-input-preset.d.ts.map