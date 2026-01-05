/**
 * Delete Knowledge Document Tool
 *
 * Deletes a document from the knowledge base.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteKnowledgeDocumentToolDef: Tool = {
  name: 'delete_knowledge_document',
  description:
    'Permanently delete a document from your knowledge base. This removes the file and all associated chunks/embeddings.',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'number',
        description: 'The ID of the document to delete',
      },
    },
    required: ['document_id'],
  },
};

export async function handleDeleteKnowledgeDocument(
  api: FlowDotApiClient,
  args: { document_id: number }
): Promise<CallToolResult> {
  try {
    const result = await api.deleteKnowledgeDocument(args.document_id);

    return {
      content: [
        {
          type: 'text',
          text: result.message || `Document ${args.document_id} deleted successfully.`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting document: ${message}` }],
      isError: true,
    };
  }
}
