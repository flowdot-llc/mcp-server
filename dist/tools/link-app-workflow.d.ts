/**
 * link_app_workflow Tool
 *
 * Link a workflow to an app so the app can invoke it.
 * Required scope: apps:manage
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const linkAppWorkflowTool: Tool;
export declare function handleLinkAppWorkflow(client: FlowDotApiClient, args: Record<string, unknown>): Promise<CallToolResult>;
//# sourceMappingURL=link-app-workflow.d.ts.map