/**
 * panic_stop MCP Tool — TRUST P4 PANIC
 *
 * Activates a sticky emergency stop for the authenticated user. Halts all
 * running workflows, recipes, agent streams, queued jobs, and relay
 * sessions, and politely declines inbound webhooks until cleared. The
 * stop is sticky — it remains active until the user clears it from a
 * user-initiated session (web, mobile, native, VR, CLI, or the panic_clear
 * MCP tool with their account password).
 *
 * Use the companion `panic_clear` and `panic_status` tools to manage state.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const panicStopTool: Tool = {
  name: 'panic_stop',
  description:
    'EMERGENCY STOP: Activates a sticky emergency stop for your account. ' +
    'Halts all running workflows, recipes, agent streams, queued jobs, and relay sessions. ' +
    'Inbound webhooks (email, Telegram, Discord, Slack, vendor integrations) will be politely declined. ' +
    'Outbound calls will return HTTP 423 Locked until you clear the stop. ' +
    'Pass confirm: true to invoke. The stop is sticky — clear it via panic_clear or from /settings/panic on the web.',
  inputSchema: {
    type: 'object',
    properties: {
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm the panic stop. The flag stays active until cleared.',
      },
    },
    required: ['confirm'],
  },
};

export async function handlePanicStop(
  api: FlowDotApiClient,
  args: { confirm: boolean }
): Promise<CallToolResult> {
  if (!args.confirm) {
    return {
      content: [{
        type: 'text',
        text: 'Panic stop not executed: confirm must be set to true. This is an emergency action that stops all your running processes.',
      }],
      isError: true,
    };
  }

  try {
    const result = await api.panicStop();

    const count = result.count ?? 0;
    const lines = [
      `## Panic Stop Complete`,
      '',
      count === 0
        ? 'No active executions or agent sessions were found.'
        : `Stopped ${count} process${count !== 1 ? 'es' : ''}.`,
    ];

    if (result.stopped && result.stopped.length > 0) {
      lines.push('', `**Workflow executions stopped:** ${result.stopped.join(', ')}`);
    }
    if (result.stoppedAgents && result.stoppedAgents.length > 0) {
      lines.push(`**Agent sessions aborted:** ${result.stoppedAgents.join(', ')}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error invoking panic stop: ${message}` }],
      isError: true,
    };
  }
}
