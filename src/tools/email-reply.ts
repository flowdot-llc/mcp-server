import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import { readLocalAttachments } from '@flowdot.ai/api';

export const emailReplyTool: Tool = {
  name: 'email_reply',
  description:
    'Reply to an email message. Subject to mailbox grant permissions. ' +
    'Use email_search or email_read first to get the message_id. ' +
    'Optional attachments are local files on this computer (needs the local FlowDot MCP server); they are sent ' +
    'with the reply and not stored by FlowDot. Never send without the user asking for this reply.',
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
      attachments: {
        type: 'array',
        description: 'Local files to attach (up to 10, 25 MB in total). Local FlowDot MCP server only.',
        items: {
          type: 'object',
          properties: { path: { type: 'string', description: 'Absolute path of a regular file on this computer' } },
          required: ['path'],
        },
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
    attachments?: Array<{ path: string }>;
  }
): Promise<CallToolResult> {
  try {
    const payload: Record<string, unknown> = {
      message_id: args.message_id,
      body: args.body,
      all: args.reply_all ?? false,
    };

    const paths = Array.isArray(args.attachments) ? args.attachments.map((a) => a && a.path).filter((p): p is string => typeof p === 'string' && p !== '') : [];
    let result: Record<string, unknown>;
    if (paths.length > 0) {
      const limits = await api.getEmailAttachmentLimits();
      payload.attachments = readLocalAttachments(paths, { maxCount: limits.max_outbound_count, maxBytes: limits.max_outbound_bytes });
      result = await api.callEmailToolWithLocalAttachments('reply', { integration_id: args.integration_id, payload }) as Record<string, unknown>;
    } else {
      result = await api.callEmailTool('reply', { integration_id: args.integration_id, payload }) as Record<string, unknown>;
    }

    const msgId = (result && result.message_id) || 'unknown';
    const attached = paths.length ? `\n- **Attachments sent:** ${paths.length}` : '';
    return {
      content: [{
        type: 'text',
        text: `Reply sent successfully.\n\n- **In reply to:** ${args.message_id}\n- **New message ID:** ${msgId}${attached}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const unconfirmed = /send_unconfirmed/.test(message)
      ? ' The provider may have sent it; check the Sent folder before trying again.'
      : '';
    return {
      content: [{ type: 'text', text: `Error replying to email: ${message}.${unconfirmed}` }],
      isError: true,
    };
  }
}
