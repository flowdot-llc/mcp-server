import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailReplyTool: Tool = {
  name: 'email_reply',
  description:
    'Reply to an email message. Subject to mailbox grant permissions. ' +
    'Use email_search or email_read first to get the message_id.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID (from list_email_integrations)',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to reply to',
      },
      body: {
        type: 'string',
        description: 'Reply body (plain text)',
      },
      reply_all: {
        type: 'boolean',
        description: 'Whether to reply to all recipients (default: false)',
      },
    },
    required: ['integration_id', 'message_id', 'body'],
  },
};

export async function handleEmailReply(
  api: FlowDotApiClient,
  args: {
    integration_id: number;
    message_id: string;
    body: string;
    reply_all?: boolean;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.callEmailTool('reply', {
      integration_id: args.integration_id,
      payload: {
        message_id: args.message_id,
        body: args.body,
        reply_all: args.reply_all ?? false,
      },
    }) as Record<string, unknown>;

    const msgId = result.message_id || 'unknown';
    return {
      content: [{
        type: 'text',
        text: `Reply sent successfully.\n\n- **In reply to:** ${args.message_id}\n- **New message ID:** ${msgId}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error replying to email: ${message}` }],
      isError: true,
    };
  }
}
