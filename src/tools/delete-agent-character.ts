/**
 * delete_agent_character MCP Tool
 *
 * Hard-delete an agent character. Requires `confirm: true` to guard
 * against accidental destruction (matches the panic_stop pattern).
 * Scope: agent_characters:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const deleteAgentCharacterTool: Tool = {
  name: 'delete_agent_character',
  description:
    'Permanently delete an agent character. Requires confirm: true. This is irreversible — any voice-call session in flight will fail with a 404 on its character lookup.',
  inputSchema: {
    type: 'object',
    properties: {
      id:      { type: 'string', description: 'Character id to delete (as a string)' },
      confirm: { type: 'boolean', description: 'Must be true to actually delete' },
    },
    required: ['id', 'confirm'],
  },
};

export async function handleDeleteAgentCharacter(
  api: FlowDotApiClient,
  args: { id: number | string; confirm: boolean },
): Promise<CallToolResult> {
  if (!args.confirm) {
    return {
      content: [
        {
          type: 'text',
          text: 'Refusing to delete agent character — pass `confirm: true` to proceed.',
        },
      ],
      isError: true,
    };
  }
  try {
    const result = await api.deleteAgentCharacter(args.id);
    return {
      content: [
        {
          type: 'text',
          text: `## 🗑️ Deleted agent character\n\n**ID:** ${result.id}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting agent character: ${message}` }],
      isError: true,
    };
  }
}
