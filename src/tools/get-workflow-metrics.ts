/**
 * get_workflow_metrics MCP Tool
 *
 * Gets execution metrics for a workflow including counts, success rates, and average duration.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getWorkflowMetricsTool: Tool = {
  name: 'get_workflow_metrics',
  description: 'Get execution metrics for a workflow including total executions, success/failure rates, average duration, and daily breakdowns.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      period: {
        type: 'string',
        description: 'Time period: 7d, 30d, 90d, or all',
        default: '30d',
      },
    },
    required: ['workflow_id'],
  },
};

export async function handleGetWorkflowMetrics(
  api: FlowDotApiClient,
  args: { workflow_id: string; period?: string }
): Promise<CallToolResult> {
  try {
    const metrics = await api.getWorkflowMetrics(args.workflow_id, args.period);

    // success_rate from API is already a percentage (0-100), not a decimal
    const successRate = typeof metrics.success_rate === 'number' ? metrics.success_rate : 0;

    // Duration should be positive; use absolute value and handle edge cases
    const avgDuration = metrics.avg_duration_ms;
    const durationDisplay = avgDuration && avgDuration > 0
      ? `${avgDuration}ms`
      : avgDuration && avgDuration < 0
        ? `${Math.abs(avgDuration)}ms` // Handle negative durations
        : 'N/A';

    const lines = [
      `## Workflow Metrics (${metrics.period || 'all time'})`,
      '',
      `**Total Executions:** ${metrics.total_executions || 0}`,
      `**Successful:** ${metrics.successful_executions || 0}`,
      `**Failed:** ${metrics.failed_executions || 0}`,
      `**Success Rate:** ${successRate.toFixed(1)}%`,
      `**Avg Duration:** ${durationDisplay}`,
    ];

    const dailyData = Array.isArray(metrics.executions_by_day) ? metrics.executions_by_day : [];
    if (dailyData.length > 0) {
      lines.push('', '### Daily Breakdown (last 7 days):');
      for (const day of dailyData.slice(-7)) {
        lines.push(`- ${day.date}: ${day.count} (${day.success_count} success, ${day.failure_count} failed)`);
      }
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting workflow metrics: ${message}` }],
      isError: true,
    };
  }
}
