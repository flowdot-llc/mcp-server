/**
 * get_input_preset MCP Tool
 *
 * Gets details of a specific input preset.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getInputPresetTool: Tool;
export declare function handleGetInputPreset(api: FlowDotApiClient, args: {
    workflow_id: string;
    preset_hash: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-input-preset.d.ts.map