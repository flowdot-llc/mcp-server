import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listEmailIntegrationsTool: Tool = {
  name: 'list_email_integrations',
  description:
    'List the user\'s active email integrations (Gmail, Outlook, IMAP/SMTP). ' +
    'Use the returned integration ID when calling email tools like email_search, email_read, email_send, etc.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleListEmailIntegrations(
  api: FlowDotApiClient
): Promise<CallToolResult> {
  try {
    const integrations = await api.listEmailIntegrations();

    if (!Array.isArray(integrations) || integrations.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No email integrations found. Connect Gmail, Outlook, or IMAP/SMTP at https://flowdot.ai/communications to get started.',
        }],
      };
    }

    const list = integrations.map((i) => {
      const lastUsed = i.last_used_at ? `last used ${i.last_used_at}` : 'never used';
      return `- **${i.integration_name}** (ID: ${i.id}) — ${i.integration_type} — ${lastUsed}`;
    }).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${integrations.length} email integration(s):\n\n${list}\n\nUse the integration ID with email tools (email_search, email_read, email_send, etc.).`,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing email integrations: ${message}` }],
      isError: true,
    };
  }
}
