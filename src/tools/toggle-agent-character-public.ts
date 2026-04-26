/**
 * toggle_agent_character_public MCP Tool
 *
 * Flip a character's public visibility. The first time a character goes
 * public, a unique hash is auto-generated; the hash is preserved across
 * future toggles so external links remain stable.
 * Scope: agent_characters:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const toggleAgentCharacterPublicTool: Tool = {
  name: 'toggle_agent_character_public',
  description:
    "Toggle a character's public/private visibility. First publish auto-generates a stable hash; subsequent toggles preserve it.",
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Numeric character id (as a string; must be yours)',
      },
    },
    required: ['id'],
  },
};

export async function handleToggleAgentCharacterPublic(
  api: FlowDotApiClient,
  args: { id: number | string },
): Promise<CallToolResult> {
  try {
    const c = await api.toggleAgentCharacterPublic(args.id);
    const lines = [
      `## ${c.is_public ? '🌐 Published' : '🔒 Made private'}: ${c.name}`,
      ``,
      `**ID:** ${c.id}`,
      `**Visibility:** ${c.is_public ? 'public' : 'private'}`,
      `**Hash:** ${c.hash ?? '—'}`,
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error toggling visibility: ${message}` }],
      isError: true,
    };
  }
}
