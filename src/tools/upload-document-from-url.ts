/**
 * Upload Document from URL Tool
 *
 * Downloads and uploads a document from a URL to the knowledge base.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const uploadDocumentFromUrlToolDef: Tool = {
  name: 'upload_document_from_url',
  description:
    'Download a document from a URL and add it to your knowledge base. Supports PDF, DOCX, TXT, Markdown, CSV, and JSON files (max 50MB).',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL of the document to download',
      },
      title: {
        type: 'string',
        description: 'Optional: Title for the document (defaults to filename from URL)',
      },
      category_id: {
        type: 'number',
        description: 'Optional: Category ID to organize the document',
      },
    },
    required: ['url'],
  },
};

export async function handleUploadDocumentFromUrl(
  api: FlowDotApiClient,
  args: { url: string; title?: string; category_id?: number }
): Promise<CallToolResult> {
  try {
    const result = await api.uploadDocumentFromUrl({
      url: args.url,
      title: args.title,
      category_id: args.category_id,
    });

    const lines = [
      `## Document Downloaded Successfully`,
      '',
      `**Title:** ${result.title}`,
      `**ID:** ${result.id}`,
      `**Hash:** ${result.hash}`,
      result.original_filename ? `**Filename:** ${result.original_filename}` : '',
      result.file_size_bytes ? `**Size:** ${(result.file_size_bytes / 1024).toFixed(1)} KB` : '',
      `**Status:** ${result.status}`,
      '',
      result.message || 'Document downloaded and queued for processing.',
      '',
      'The document will be processed in the background. Use list_knowledge_documents to check the status.',
    ].filter(Boolean);

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error uploading document from URL: ${message}` }],
      isError: true,
    };
  }
}
