/**
 * Update Knowledge Document Content Tool
 *
 * Replaces the full content of a knowledge base document. Overwrites the file
 * on disk and triggers reprocessing (chunks + embeddings regenerated). Use this
 * when you want to rewrite an entire document. For targeted edits of a single
 * section, use patch_knowledge_document_section instead.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const updateKnowledgeDocumentContentToolDef: Tool = {
  name: 'update_knowledge_document_content',
  description:
    'Replace the full content of a knowledge base document. Overwrites the file on disk and triggers reprocessing (chunks and embeddings are regenerated). Only works for text-based documents. Requires edit permission on the document. For targeted edits of a single section, prefer patch_knowledge_document_section.',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: ['number', 'string'],
        description: 'The document ID (number) or hash (string)',
      },
      content: {
        type: 'string',
        description: 'The new full content to write to the document',
      },
    },
    required: ['document_id', 'content'],
  },
};

export async function handleUpdateKnowledgeDocumentContent(
  api: FlowDotApiClient,
  args: { document_id: number | string; content: string }
): Promise<CallToolResult> {
  try {
    const result = await api.updateKnowledgeDocumentContent(args.document_id, args.content);

    const lines = [
      '## Document Content Updated',
      '',
      `**ID:** ${result.id}`,
      `**New size:** ${result.file_size_bytes} bytes`,
      `**Status:** ${result.status}`,
      '',
      result.message || 'Document content replaced and queued for reprocessing.',
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating document content: ${message}` }],
      isError: true,
    };
  }
}
