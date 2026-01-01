/**
 * create_shared_result MCP Tool
 *
 * Creates a shareable link for a workflow execution result.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const createSharedResultTool: Tool = {
  name: 'create_shared_result',
  description: 'Create a shareable link for a workflow execution result. This allows you to share specific execution outputs with others.',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID (hash)',
      },
      execution_id: {
        type: 'string',
        description: 'The execution ID to share',
      },
      title: {
        type: 'string',
        description: 'Optional title for the shared result',
      },
      description: {
        type: 'string',
        description: 'Optional description for the shared result',
      },
      preset_hash: {
        type: 'string',
        description: 'Optional preset hash if the execution was from a preset',
      },
      expires_in_days: {
        type: 'number',
        description: 'Optional number of days until the shared link expires (1-365)',
      },
    },
    required: ['workflow_id', 'execution_id'],
  },
};

export async function handleCreateSharedResult(
  api: FlowDotApiClient,
  args: {
    workflow_id: string;
    execution_id: string;
    title?: string;
    description?: string;
    preset_hash?: string;
    expires_in_days?: number;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.createSharedResult(args.workflow_id, {
      execution_id: args.execution_id,
      title: args.title,
      description: args.description,
      preset_hash: args.preset_hash,
      expires_in_days: args.expires_in_days,
    });

    const lines = [
      '## Shared Result Created Successfully',
      '',
      `**Hash:** ${result.hash}`,
      `**Share URL:** ${result.share_url}`,
      '',
      '✓ Anyone with this link can view the execution results.',
    ];

    if (result.title) {
      lines.push(`**Title:** ${result.title}`);
    }

    if (result.description) {
      lines.push(`**Description:** ${result.description}`);
    }

    if (result.expires_at) {
      lines.push('', `**Expires:** ${result.expires_at}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating shared result: ${message}` }],
      isError: true,
    };
  }
}
