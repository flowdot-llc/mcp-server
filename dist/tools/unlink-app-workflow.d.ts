/**
 * unlink_app_workflow Tool
 *
 * Unlink a workflow from an app.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const unlinkAppWorkflowTool: Tool;
export declare function handleUnlinkAppWorkflow(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=unlink-app-workflow.d.ts.map