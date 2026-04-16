import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const emailReadTool: Tool = {
  name: 'email_read',
  description:
    'Read a specific email message by ID. Returns full message content including headers, body, and attachments list. ' +
    'Use email_search or email_list_threads first to find message IDs.',
  inputSchema: {
    type: 'object',
    properties: {
      integration_id: {
        type: 'number',
        description: 'The email integration ID (from list_email_integrations)',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to read',
      },
    },
    required: ['integration_id', 'message_id'],
  },
};

export async function handleEmailRead(
  api: FlowDotApiClient,
  args: { integration_id: number; message_id: string }
): Promise<CallToolResult> {
  try {
    const result = await api.callEmailTool('get', {
      integration_id: args.integration_id,
      payload: { message_id: args.message_id },
    }) as Record<string, unknown>;

    const formatted = formatMessage(result);

    return { content: [{ type: 'text', text: formatted }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error reading email: ${message}` }],
      isError: true,
    };
  }
}

function formatMessage(msg: Record<string, unknown>): string {
  const headers = msg.headers as Record<string, string> | undefined;
  const parts: string[] = [];

  if (headers) {
    parts.push(`**From:** ${headers.from || 'unknown'}`);
    parts.push(`**To:** ${headers.to || 'unknown'}`);
    if (headers.cc) parts.push(`**CC:** ${headers.cc}`);
    parts.push(`**Subject:** ${headers.subject || '(no subject)'}`);
    parts.push(`**Date:** ${headers.date || 'unknown'}`);
  }

  if (msg.labels) parts.push(`**Labels:** ${(msg.labels as string[]).join(', ')}`);

  parts.push('');

  if (msg.body_text) {
    const body = String(msg.body_text);
    parts.push(body.length > 3000 ? body.substring(0, 3000) + '\n\n…(truncated)' : body);
  } else if (msg.snippet) {
    parts.push(String(msg.snippet));
  }

  const attachments = msg.attachments as Array<{ filename: string; mime: string; size: number }> | undefined;
  if (attachments && attachments.length > 0) {
    parts.push('');
    parts.push(`**Attachments (${attachments.length}):**`);
    attachments.forEach(a => parts.push(`- ${a.filename} (${a.mime}, ${a.size} bytes)`));
  }

  return parts.join('\n');
}
