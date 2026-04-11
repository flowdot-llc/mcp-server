/**
 * Get Knowledge Document Content Tool
 *
 * Fetches the full raw text content of a knowledge base document by ID.
 * Unlike get_knowledge_document (which returns metadata only), this returns
 * the complete byte-exact file contents suitable for reading or editing.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const getKnowledgeDocumentContentToolDef: Tool = {
  name: 'get_knowledge_document_content',
  description:
    'Fetch the full raw text content of a knowledge base document by ID or hash. Use this when you need to read an entire document (for example, a stable reference doc like Values or Voice) rather than a RAG-style chunk retrieval. Returns the complete file content as it was uploaded, without chunking or relevance filtering. Only works for text-based documents (markdown, plain text, CSV, JSON).',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: ['number', 'string'],
        description: 'The document ID (number) or hash (string)',
      },
    },
    required: ['document_id'],
  },
};

export async function handleGetKnowledgeDocumentContent(
  api: FlowDotApiClient,
  args: { document_id: number | string }
): Promise<CallToolResult> {
  try {
    const result = await api.getKnowledgeDocumentContent(args.document_id);

    const lines = [
      `## Document Content: ${result.title}`,
      '',
      `**ID:** ${result.id}`,
      `**Hash:** ${result.hash}`,
      `**MIME Type:** ${result.mime_type}`,
      `**Size:** ${result.file_size_bytes} bytes`,
      `**Status:** ${result.status}`,
      '',
      '### Content',
      '',
      result.content,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting document content: ${message}` }],
      isError: true,
    };
  }
}
