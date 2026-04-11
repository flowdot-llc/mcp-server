/**
 * Patch Knowledge Document Section Tool
 *
 * Edits a targeted section of a knowledge base document by find-and-replace.
 * Safe against accidental mass replacement: the old_text must match EXACTLY
 * ONCE in the current document. If 0 or 2+ matches, the patch fails with an
 * error so the caller can expand old_text to make it unique.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const patchKnowledgeDocumentSectionToolDef: Tool = {
  name: 'patch_knowledge_document_section',
  description:
    'Edit a targeted section of a knowledge base document by find-and-replace. The old_text must be at least 10 characters and must match EXACTLY ONCE in the current document. If there are 0 or 2+ matches the request fails with an error — expand old_text to make it unique and retry. Triggers reprocessing of chunks and embeddings after the edit. Requires edit permission on the document. Use this for targeted section edits; for full rewrites use update_knowledge_document_content.',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: ['number', 'string'],
        description: 'The document ID (number) or hash (string)',
      },
      old_text: {
        type: 'string',
        description:
          'The exact text to find and replace. Must be at least 10 characters and must match exactly once in the document (including whitespace and line breaks).',
      },
      new_text: {
        type: 'string',
        description:
          'The replacement text. Can be an empty string to delete the matched section.',
      },
    },
    required: ['document_id', 'old_text', 'new_text'],
  },
};

export async function handlePatchKnowledgeDocumentSection(
  api: FlowDotApiClient,
  args: { document_id: number | string; old_text: string; new_text: string }
): Promise<CallToolResult> {
  try {
    const result = await api.patchKnowledgeDocumentSection(
      args.document_id,
      args.old_text,
      args.new_text
    );

    const lines = [
      '## Document Section Patched',
      '',
      `**ID:** ${result.id}`,
      `**New size:** ${result.file_size_bytes} bytes`,
      `**Bytes changed:** ${result.bytes_changed > 0 ? '+' : ''}${result.bytes_changed}`,
      `**Status:** ${result.status}`,
      '',
      result.message || 'Section patched and queued for reprocessing.',
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error patching document section: ${message}` }],
      isError: true,
    };
  }
}
