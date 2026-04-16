import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailSendTool: Tool = {
  name: 'email_send',
  description:
    'Send an email through a connected mailbox. Subject to mailbox grant permissions — ' +
    'the user may need to approve the action via Telegram/Discord if no standing grant exists. ' +
    'Use list_email_integrations first to get the integration_id.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID (from list_email_integrations)',
      },
      to: {
        type: 'string',
        description: 'Recipient email address (or comma-separated list)',
      },
      subject: {
        type: 'string',
        description: 'Email subject line',
      },
      body: {
        type: 'string',
        description: 'Email body (plain text)',
      },
      cc: {
        type: 'string',
        description: 'CC recipients (comma-separated)',
      },
      bcc: {
        type: 'string',
        description: 'BCC recipients (comma-separated)',
      },
    },
    required: ['integration_id', 'to', 'subject', 'body'],
  },
};

export async function handleEmailSend(
  api: FlowDotApiClient,
  args: {
    integration_id: number;
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }
): Promise<CallToolResult> {
  try {
    const payload: Record<string, unknown> = {
      to: args.to,
      subject: args.subject,
      body: args.body,
    };
    if (args.cc) payload.cc = args.cc;
    if (args.bcc) payload.bcc = args.bcc;

    const result = await api.callEmailTool('send', {
      integration_id: args.integration_id,
      payload,
    }) as Record<string, unknown>;

    const msgId = result.message_id || 'unknown';
    return {
      content: [{
        type: 'text',
        text: `Email sent successfully.\n\n- **To:** ${args.to}\n- **Subject:** ${args.subject}\n- **Message ID:** ${msgId}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error sending email: ${message}` }],
      isError: true,
    };
  }
}
