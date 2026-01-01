/**
 * get_workflow_metrics MCP Tool
 *
 * Gets execution metrics for a workflow including counts, success rates, and average duration.
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
export declare const getWorkflowMetricsTool: Tool;
export declare function handleGetWorkflowMetrics(api: FlowDotApiClient, args: {
    workflow_id: string;
    period?: string;
}): Promise<CallToolResult>;
//# sourceMappingURL=get-workflow-metrics.d.ts.map