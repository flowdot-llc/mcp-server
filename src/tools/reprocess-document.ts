/**
 * Reprocess Document Tool
 *
 * Reprocesses a failed or pending document.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const reprocessDocumentToolDef: Tool = {
  name: 'reprocess_document',
  description:
    'Reprocess a document that failed processing or is stuck in pending/processing status. Clears existing chunks and requeues for processing.',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'number',
        description: 'The ID of the document to reprocess',
      },
    },
    required: ['document_id'],
  },
};

export async function handleReprocessDocument(
  api: FlowDotApiClient,
  args: { document_id: number }
): Promise<CallToolResult> {
  try {
    await api.reprocessDocument(args.document_id);

    return {
      content: [
        {
          type: 'text',
          text: `Document ${args.document_id} queued for reprocessing.\n\nUse list_knowledge_documents or get_knowledge_document to check the status.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error reprocessing document: ${message}` }],
      isError: true,
    };
  }
}
