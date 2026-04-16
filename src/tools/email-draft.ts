import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailDraftTool: Tool = {
  name: 'email_draft',
  description:
    'Create an email draft in a connected mailbox. The draft is saved but not sent. ' +
    'Subject to mailbox grant permissions.',
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
    },
    required: ['integration_id', 'to', 'subject', 'body'],
  },
};

export async function handleEmailDraft(
  api: FlowDotApiClient,
  args: {
    integration_id: number;
    to: string;
    subject: string;
    body: string;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.callEmailTool('draft', {
      integration_id: args.integration_id,
      payload: {
        to: args.to,
        subject: args.subject,
        body: args.body,
      },
    }) as Record<string, unknown>;

    const msgId = result.message_id || 'unknown';
    return {
      content: [{
        type: 'text',
        text: `Draft created successfully.\n\n- **To:** ${args.to}\n- **Subject:** ${args.subject}\n- **Draft ID:** ${msgId}`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating draft: ${message}` }],
      isError: true,
    };
  }
}
