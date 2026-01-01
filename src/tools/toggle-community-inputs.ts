/**
 * toggle_community_inputs MCP Tool
 *
 * Enables or disables community inputs (input presets) for a workflow.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const toggleCommunityInputsTool: Tool = {
  name: 'toggle_community_inputs',
  description: 'Enable or disable community inputs (input presets) for a workflow. When enabled, users can create and share pre-configured input values for the workflow. Only the workflow owner can change this setting.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      enabled: {
        type: 'boolean',
        description: 'true to enable community inputs, false to disable',
      },
    },
    required: ['workflow_id', 'enabled'],
  },
};

export async function handleToggleCommunityInputs(
  api: FlowDotApiClient,
  args: { workflow_id: string; enabled: boolean }
): Promise<CallToolResult> {
  try {
    const result = await api.toggleCommunityInputs(args.workflow_id, args.enabled);

    const emoji = result.community_inputs_enabled ? '✓' : '✗';
    const status = result.community_inputs_enabled ? 'Enabled' : 'Disabled';

    const lines = [
      `## Community Inputs ${status}`,
      '',
      `**Workflow:** ${result.workflow_name} (${result.workflow_id})`,
      `**Status:** ${emoji} ${status}`,
      '',
      result.message,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error toggling community inputs: ${message}` }],
      isError: true,
    };
  }
}
