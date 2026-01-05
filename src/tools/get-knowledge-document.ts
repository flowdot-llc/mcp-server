/**
 * Get Knowledge Document Tool
 *
 * Gets detailed information about a specific document.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getKnowledgeDocumentToolDef: Tool = {
  name: 'get_knowledge_document',
  description:
    'Get detailed information about a specific document in your knowledge base by ID or hash.',
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

export async function handleGetKnowledgeDocument(
  api: FlowDotApiClient,
  args: { document_id: number | string }
): Promise<CallToolResult> {
  try {
    const doc = await api.getKnowledgeDocument(args.document_id);

    const lines = [
      `## Document: ${doc.title}`,
      '',
      `**ID:** ${doc.id}`,
      `**Hash:** ${doc.hash}`,
      `**Original Filename:** ${doc.original_filename}`,
      '',
      '### Status',
      `- **Status:** ${doc.status}`,
      doc.processing_error ? `- **Error:** ${doc.processing_error}` : '',
      `- **Processed At:** ${doc.processed_at || 'Not yet processed'}`,
      '',
      '### Storage',
      `- **Size:** ${doc.formatted_size} (${doc.file_size_bytes} bytes)`,
      `- **MIME Type:** ${doc.mime_type}`,
      '',
      '### Processing',
      `- **Chunks:** ${doc.chunk_count}`,
      `- **Tokens:** ${doc.token_count}`,
      `- **Has Embeddings:** ${doc.has_embeddings ? 'Yes' : 'No'}`,
      '',
    ].filter(Boolean);

    if (doc.category) {
      lines.push('### Category');
      lines.push(`- **Name:** ${doc.category.name}`);
      lines.push(`- **ID:** ${doc.category.id}`);
      lines.push('');
    }

    if (doc.metadata && Object.keys(doc.metadata).length > 0) {
      lines.push('### Metadata');
      lines.push('```json');
      lines.push(JSON.stringify(doc.metadata, null, 2));
      lines.push('```');
      lines.push('');
    }

    lines.push(`**Created:** ${doc.created_at}`);

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting document: ${message}` }],
      isError: true,
    };
  }
}
