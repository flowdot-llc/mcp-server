/**
 * update_input_preset MCP Tool
 *
 * Updates an existing input preset.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const updateInputPresetTool: Tool;
export declare function handleUpdateInputPreset(api: FlowDotApiClient, args: {
    workflow_id: string;
    preset_hash: string;
    title?: string;
    description?: string;
    inputs?: Record<string, unknown>;
}): Promise<CallToolResult>;
//# sourceMappingURL=update-input-preset.d.ts.map