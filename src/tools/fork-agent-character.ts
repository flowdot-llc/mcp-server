/**
 * fork_agent_character MCP Tool
 *
 * Fork a public character to the caller's library. Voice config + persona
 * are copied verbatim; LLM provider/model/temperature reset to the DB
 * default 'default'/'default' so the user must pick their own LLM (and
 * the resulting fork is intentionally INCOMPLETE until they do).
 * Scope: agent_characters:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const forkAgentCharacterTool: Tool = {
  name: 'fork_agent_character',
  description:
    "Fork a public agent character to your library by hash. Voice config + persona are copied; the LLM choice is reset so you pick your own. The forked character will report incomplete until you fill in llm_provider/llm_model/llm_temperature.",
  inputSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'Public hash of the source character (the alphanumeric id, not the numeric id)',
      },
    },
    required: ['hash'],
  },
};

export async function handleForkAgentCharacter(
  api: FlowDotApiClient,
  args: { hash: string },
): Promise<CallToolResult> {
  try {
    const c = await api.forkAgentCharacter(args.hash);
    const lines = [
      `## 🍴 Forked agent character: ${c.name}`,
      ``,
      `**New ID:** ${c.id}`,
      `**Voice (copied):** ${c.voice_provider ?? '—'} / ${c.voice_id ?? '—'}`,
      `**LLM (reset):** ${c.llm_provider ?? '—'} / ${c.llm_model ?? '—'}${typeof c.llm_temperature === 'number' ? ` (temp ${c.llm_temperature})` : ''}`,
      ``,
      c.is_complete
        ? '> ✅ Ready to call.'
        : `> ⚠️ Pick your LLM before calling. Missing: ${c.missing_fields.join(', ')}. Use update_agent_character.`,
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error forking agent character: ${message}` }],
      isError: true,
    };
  }
}
