/**
 * create_input_preset MCP Tool
 *
 * Creates a new input preset (community input) for a workflow.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const createInputPresetTool: Tool;
export declare function handleCreateInputPreset(api: FlowDotApiClient, args: {
    workflow_id: string;
    title: string;
    description?: string;
    inputs: Record<string, unknown>;
}): Promise<CallToolResult>;
//# sourceMappingURL=create-input-preset.d.ts.map