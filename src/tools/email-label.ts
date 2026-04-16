import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailLabelTool: Tool = {
  name: 'email_label',
  description:
    'Add or remove labels on an email message. Subject to mailbox grant permissions.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to label',
      },
      add_labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Labels to add (e.g., ["STARRED", "IMPORTANT"])',
      },
      remove_labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Labels to remove',
      },
    },
    required: ['integration_id', 'message_id'],
  },
};

export async function handleEmailLabel(
  api: FlowDotApiClient,
  args: {
    integration_id: number;
    message_id: string;
    add_labels?: string[];
    remove_labels?: string[];
  }
): Promise<CallToolResult> {
  try {
    await api.callEmailTool('label', {
      integration_id: args.integration_id,
      payload: {
        message_id: args.message_id,
        add_labels: args.add_labels ?? [],
        remove_labels: args.remove_labels ?? [],
      },
    });

    const added = args.add_labels?.length ? `Added: ${args.add_labels.join(', ')}` : '';
    const removed = args.remove_labels?.length ? `Removed: ${args.remove_labels.join(', ')}` : '';
    const changes = [added, removed].filter(Boolean).join('. ');

    return {
      content: [{ type: 'text', text: `Labels updated on message ${args.message_id}. ${changes}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating labels: ${message}` }],
      isError: true,
    };
  }
}
