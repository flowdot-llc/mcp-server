/**
 * create_agent_character MCP Tool
 *
 * Creates an agent character. The Hub validates voice-config completeness
 * server-side via App\Support\AgentCharacterCompleteness — incomplete
 * payloads return 422 with `code: CHARACTER_VOICE_CONFIG_INCOMPLETE` and a
 * `missing[]` list which we surface inline so the agent knows exactly
 * which fields the user still needs to provide.
 * Scope: agent_characters:manage
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';
import type { CreateAgentCharacterInput } from '@flowdot.ai/api';

export const createAgentCharacterTool: Tool = {
  name: 'create_agent_character',
  description:
    'Create a new agent character (voice-call persona). All voice/STT/LLM/persona fields are required — the Hub rejects incomplete characters at save time with code CHARACTER_VOICE_CONFIG_INCOMPLETE. See learn://characters for recommended per-provider values.',
  inputSchema: {
    type: 'object',
    properties: {
      name:               { type: 'string',  description: 'Display name (max 50)' },
      avatar:             { type: 'string',  description: 'Optional emoji or avatar URL' },
      voice_provider:     { type: 'string',  description: "TTS provider id, e.g. 'fish-audio', 'elevenlabs', 'cartesia', 'openai'" },
      voice_id:           { type: 'string',  description: 'Provider-specific voice id (Fish reference id, ElevenLabs voice id, etc.)' },
      voice_name:         { type: 'string',  description: 'Optional human-readable voice label' },
      tts_model:          { type: 'string',  description: "Provider TTS model id (e.g. 's1' for Fish, 'eleven_turbo_v2' for ElevenLabs)" },
      voice_settings:     { type: 'object',  description: 'Provider-specific voice settings object. Fish: {temperature,top_p,latency,chunk_length}. ElevenLabs: {stability,similarity_boost}. See learn://characters.', additionalProperties: true },
      stt_provider:       { type: 'string',  description: "STT provider id, currently 'openai' is the only LiveKit-supported server-side option" },
      stt_model:          { type: 'string',  description: "STT model id (e.g. 'whisper-1')" },
      llm_provider:       { type: 'string',  description: "LLM provider id, e.g. 'openai', 'anthropic', 'flowdot'" },
      llm_model:          { type: 'string',  description: 'LLM model id; must be one the FlowDot aggregator currently serves if using flowdot provider' },
      llm_temperature:    { type: 'number',  description: 'LLM temperature (0-2)' },
      personality_prompt: { type: 'string',  description: 'Persona / system-prompt text (max 2000)' },
      is_public:          { type: 'boolean', description: 'Publish to community (default false). When true, hash is auto-generated.' },
      traits:             { type: 'array',   items: { type: 'string' }, description: 'Optional personality traits (max 20, each ≤ 30 chars)' },
    },
    required: [
      'name',
      'voice_provider',
      'voice_id',
      'tts_model',
      'voice_settings',
      'stt_provider',
      'stt_model',
      'llm_provider',
      'llm_model',
      'llm_temperature',
      'personality_prompt',
    ],
  },
};

export async function handleCreateAgentCharacter(
  api: FlowDotApiClient,
  args: CreateAgentCharacterInput,
): Promise<CallToolResult> {
  try {
    const c = await api.createAgentCharacter(args);
    const lines = [
      `## ✅ Created agent character: ${c.name}`,
      ``,
      `**ID:** ${c.id}${c.hash ? ` | **Hash:** ${c.hash}` : ''}`,
      `**Voice:** ${c.voice_provider} / ${c.voice_id}`,
      `**LLM:** ${c.llm_provider} / ${c.llm_model} (temp ${c.llm_temperature})`,
      `**STT:** ${c.stt_provider} / ${c.stt_model}`,
      ``,
      c.is_complete
        ? '> Ready to call. Use `get_agent_character` to confirm or start a voice call from the FlowDot UI.'
        : `> ⚠️ Server still reports missing: ${c.missing_fields.join(', ')}`,
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // The Hub formats incomplete-config errors with the missing[] list in
    // the message — surface it directly so the agent can ask the user for
    // those specific fields.
    return {
      content: [{ type: 'text', text: `Error creating agent character: ${message}` }],
      isError: true,
    };
  }
}
