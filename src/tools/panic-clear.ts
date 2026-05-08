/**
 * panic_clear MCP Tool — clear the user's active emergency stop.
 *
 * Requires the user's account password as a recent-auth challenge (T9 in
 * PANIC.md §12.2). The Hub validates the password against the user's
 * credential and rejects with `password_confirmation_required` otherwise.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const panicClearTool: Tool = {
  name: 'panic_clear',
  description:
    'Clear an active emergency stop for your account. Requires `confirm: true` AND your account password (recent-auth challenge per PANIC.md §12.2 T9). ' +
    'Outbound activity resumes after clear. You receive a notification on every COMMS channel and an email when the stop is cleared.',
  inputSchema: {
    type: 'object',
    properties: {
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm the clear.',
      },
      password: {
        type: 'string',
        description: 'Your FlowDot account password — required as a recent-auth challenge.',
      },
    },
    required: ['confirm', 'password'],
  },
};

export async function handlePanicClear(
  api: FlowDotApiClient,
  args: { confirm: boolean; password: string }
): Promise<CallToolResult> {
  if (!args.confirm) {
    return {
      content: [{
        type: 'text',
        text: 'Panic clear not executed: confirm must be set to true.',
      }],
      isError: true,
    };
  }

  if (!args.password) {
    return {
      content: [{
        type: 'text',
        text: 'Panic clear requires your account password (recent-auth challenge).',
      }],
      isError: true,
    };
  }

  try {
    const result = await api.panicClear(args.password);

    if (!result.success) {
      const error = result.error ?? 'unknown';
      const text = error === 'password_confirmation_required'
        ? 'Incorrect password. Re-enter your account password to clear the emergency stop.'
        : `Panic clear failed: ${error}`;
      return { content: [{ type: 'text', text }], isError: true };
    }

    if (!result.was_panicked) {
      return {
        content: [{
          type: 'text',
          text: 'No active emergency stop. (Idempotent clear — nothing to do.)',
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: '## Emergency stop cleared\n\nOutbound activity has resumed. Scheduled goals, email pollers, and inbound webhooks are processing again. A notification has been dispatched to every configured COMMS channel and your account email.',
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error clearing panic: ${message}` }],
      isError: true,
    };
  }
}
