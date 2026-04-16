import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const whoamiTool: Tool = {
  name: 'whoami',
  description:
    'Get information about the currently authenticated user and MCP token. ' +
    'Returns user profile (name, email, avatar) and token details (name, scopes, expiry).',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleWhoami(
  api: FlowDotApiClient
): Promise<CallToolResult> {
  try {
    const result = await api.whoami();

    const scopeList = result.token.scopes.length > 0
      ? result.token.scopes.map((s: string) => `  - \`${s}\``).join('\n')
      : '  (no scopes)';

    const expires = result.token.expires_at
      ? `Expires: ${result.token.expires_at}`
      : 'No expiration';

    const text = [
      `## User`,
      `- **Name:** ${result.user.name}`,
      `- **Email:** ${result.user.email}`,
      `- **ID:** ${result.user.id}`,
      `- **Joined:** ${result.user.created_at}`,
      ``,
      `## Token`,
      `- **Name:** ${result.token.name}`,
      `- **${expires}**`,
      `- **Last used:** ${result.token.last_used_at || 'never'}`,
      `- **Scopes:**`,
      scopeList,
    ].join('\n');

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error fetching user info: ${message}` }],
      isError: true,
    };
  }
}
