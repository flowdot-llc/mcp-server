/**
 * List Knowledge Documents Tool
 *
 * Lists documents in the user's knowledge base with optional filtering.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listKnowledgeDocumentsToolDef: Tool = {
  name: 'list_knowledge_documents',
  description:
    'List documents in your knowledge base. Optionally filter by category or status. Shows document title, status, size, and chunk count.',
  inputSchema: {
    type: 'object',
    properties: {
      category_id: {
        type: 'number',
        description: 'Filter documents by category ID (optional)',
      },
      status: {
        type: 'string',
        enum: ['pending', 'processing', 'ready', 'failed'],
        description: 'Filter documents by processing status (optional)',
      },
    },
    required: [],
  },
};

export async function handleListKnowledgeDocuments(
  api: FlowDotApiClient,
  args: { category_id?: number; status?: 'pending' | 'processing' | 'ready' | 'failed' }
): Promise<CallToolResult> {
  try {
    const documents = await api.listKnowledgeDocuments({
      category_id: args.category_id,
      status: args.status,
    });

    if (documents.length === 0) {
      let message = 'No documents found in your knowledge base.';
      if (args.category_id || args.status) {
        message += ' Try adjusting your filters.';
      } else {
        message += ' Use upload_text_document or upload_document_from_url to add documents.';
      }
      return {
        content: [{ type: 'text', text: message }],
      };
    }

    const statusIcon = (status: string) => {
      switch (status) {
        case 'ready':
          return '✓';
        case 'processing':
          return '⏳';
        case 'pending':
          return '○';
        case 'failed':
          return '✗';
        default:
          return '?';
      }
    };

    const lines = [
      `## Knowledge Base Documents (${documents.length})`,
      '',
    ];

    for (const doc of documents) {
      lines.push(`### ${statusIcon(doc.status)} ${doc.title}`);
      lines.push(`- **ID:** ${doc.id} | **Hash:** ${doc.hash}`);
      lines.push(`- **Status:** ${doc.status}${doc.processing_error ? ` (Error: ${doc.processing_error})` : ''}`);
      lines.push(`- **Size:** ${doc.formatted_size} | **Chunks:** ${doc.chunk_count} | **Tokens:** ${doc.token_count}`);
      lines.push(`- **Type:** ${doc.mime_type}`);
      if (doc.category) {
        lines.push(`- **Category:** ${doc.category.name}`);
      }
      if (doc.has_embeddings) {
        lines.push(`- **Embeddings:** Available`);
      }
      lines.push(`- **Created:** ${doc.created_at}`);
      lines.push('');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing documents: ${message}` }],
      isError: true,
    };
  }
}
