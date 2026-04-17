/**
 * panic_stop MCP Tool — TRUST P4 PANIC
 *
 * Immediately stops ALL active workflow executions and agent sessions
 * for the authenticated user. Requires confirm: true to prevent
 * accidental invocation.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const panicStopTool: Tool = {
  name: 'panic_stop',
  description:
    'EMERGENCY STOP: Immediately terminates ALL active workflow executions and agent sessions for your account. ' +
    'You must pass confirm: true to prevent accidental use. ' +
    'Use this when you need to halt all AI activity immediately.',
  inputSchema: {
    type: 'object',
    properties: {
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm the panic stop. This is an irreversible action.',
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
