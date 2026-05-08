/**
 * panic_status MCP Tool — read-only check of the user's emergency-stop state.
 *
 * Companion to `panic_stop` and `panic_clear`. See PANIC.md.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const panicStatusTool: Tool = {
  name: 'panic_status',
  description:
    'Read the current emergency-stop status for your account. ' +
    'Returns whether a stop is active, when it was activated, and what was halted. ' +
    'Read-only — does not change state.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handlePanicStatus(
  api: FlowDotApiClient
): Promise<CallToolResult> {
  try {
    const result = await api.panicStatus();

    if (!result.panicked) {
      return {
        content: [{
          type: 'text',
          text: 'No active emergency stop. Your account is operating normally.',
        }],
      };
    }

    const lines = [
      '## Emergency stop is ACTIVE',
      '',
      `**Activated at:** ${result.panicked_at ?? 'unknown'}`,
      '',
      'Outbound activity is blocked. Inbound webhooks are being politely declined.',
      'Clear the stop by calling `panic_clear` (with your password) or from /settings/panic on the web.',
    ];

    if (result.last_summary) {
      lines.push('', '**Last halt summary:**', '```json', JSON.stringify(result.last_summary, null, 2), '```');
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error reading panic status: ${message}` }],
      isError: true,
    };
  }
}
