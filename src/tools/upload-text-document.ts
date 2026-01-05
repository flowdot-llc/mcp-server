/**
 * Upload Text Document Tool
 *
 * Uploads text content directly as a document to the knowledge base.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const uploadTextDocumentToolDef: Tool = {
  name: 'upload_text_document',
  description:
    'Upload text content directly as a document to your knowledge base. Ideal for creating documents from AI-generated content, notes, or any text. The document will be processed and chunked for RAG queries.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title for the document (max 255 characters)',
      },
      content: {
        type: 'string',
        description: 'The text content to upload (max 10MB)',
      },
      category_id: {
        type: 'number',
        description: 'Optional: Category ID to organize the document',
      },
      mime_type: {
        type: 'string',
        enum: ['text/plain', 'text/markdown', 'application/json'],
        description: 'Content type: text/plain (default), text/markdown, or application/json',
      },
    },
    required: ['title', 'content'],
  },
};

export async function handleUploadTextDocument(
  api: FlowDotApiClient,
  args: {
    title: string;
    content: string;
    category_id?: number;
    mime_type?: 'text/plain' | 'text/markdown' | 'application/json';
  }
): Promise<CallToolResult> {
  try {
    const result = await api.uploadTextDocument({
      title: args.title,
      content: args.content,
      category_id: args.category_id,
      mime_type: args.mime_type,
    });

    const lines = [
      `## Document Uploaded Successfully`,
      '',
      `**Title:** ${result.title}`,
      `**ID:** ${result.id}`,
      `**Hash:** ${result.hash}`,
      `**Status:** ${result.status}`,
      '',
      result.message || 'Document created and queued for processing.',
      '',
      'The document will be processed in the background. Use list_knowledge_documents to check the status.',
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error uploading document: ${message}` }],
      isError: true,
    };
  }
}
