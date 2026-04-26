/**
 * update_agent_character MCP Tool
 *
 * Partial-update an agent character. Only fields present in the input are
 * patched. The Hub re-runs completeness validation on the post-merge state
 * — patches that would leave the row incomplete return 422 with the same
 * CHARACTER_VOICE_CONFIG_INCOMPLETE shape as create_agent_character.
 * Scope: agent_characters:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { UpdateAgentCharacterInput } from '@flowdot.ai/api';

export const updateAgentCharacterTool: Tool = {
  name: 'update_agent_character',
  description:
    'Update an agent character. Send only the fields you want to change. The Hub validates the post-merge state — if the patch would leave the character incomplete the call returns CHARACTER_VOICE_CONFIG_INCOMPLETE with the missing fields.',
  inputSchema: {
    type: 'object',
    properties: {
      id:                 { type: 'string', description: 'Character id to update (as a string)' },
      name:               { type: 'string' },
      avatar:             { type: 'string' },
      voice_provider:     { type: 'string', description: "TTS provider id ('fish-audio', 'elevenlabs', 'cartesia', 'openai')" },
      voice_id:           { type: 'string' },
      voice_name:         { type: 'string' },
      tts_model:          { type: 'string' },
      voice_settings:     { type: 'object', additionalProperties: true, description: 'Provider-specific settings — see learn://characters' },
      stt_provider:       { type: 'string' },
      stt_model:          { type: 'string' },
      llm_provider:       { type: 'string' },
      llm_model:          { type: 'string' },
      llm_temperature:    { type: 'number', description: '0-2' },
      personality_prompt: { type: 'string' },
      is_public:          { type: 'boolean' },
      traits:             { type: 'array', items: { type: 'string' } },
    },
    required: ['id'],
    additionalProperties: false,
  },
};

export async function handleUpdateAgentCharacter(
  api: FlowDotApiClient,
  args: UpdateAgentCharacterInput & { id: number | string },
): Promise<CallToolResult> {
  try {
    const { id, ...patch } = args;
    const c = await api.updateAgentCharacter(id, patch);
    const lines = [
      `## ${c.is_complete ? '✅' : '⚠️'} Updated agent character: ${c.name}`,
      ``,
      `**ID:** ${c.id}`,
      `**Voice:** ${c.voice_provider ?? '—'} / ${c.voice_id ?? '—'}`,
      `**LLM:** ${c.llm_provider ?? '—'} / ${c.llm_model ?? '—'}${typeof c.llm_temperature === 'number' ? ` (temp ${c.llm_temperature})` : ''}`,
      `**STT:** ${c.stt_provider ?? '—'} / ${c.stt_model ?? '—'}`,
      ``,
      c.is_complete
        ? '> ✅ Ready to call.'
        : `> ⚠️ Still missing: ${c.missing_fields.join(', ')}`,
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating agent character: ${message}` }],
      isError: true,
    };
  }
}
