/**
 * toggle_workflow_public MCP Tool
 *
 * Toggles a workflow's public/private visibility status.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const toggleWorkflowPublicTool: Tool;
export declare function handleToggleWorkflowPublic(api: FlowDotApiClient, args: {
    workflow_id: string;
    is_public: boolean;
}): Promise<CallToolResult>;
//# sourceMappingURL=toggle-workflow-public.d.ts.map