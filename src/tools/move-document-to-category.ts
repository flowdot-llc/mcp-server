/**
 * Move Document to Category Tool
 *
 * Moves a document to a different category.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const moveDocumentToCategoryToolDef: Tool = {
  name: 'move_document_to_category',
  description: 'Move a document to a different category, or remove it from its current category (make it uncategorized).',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'number',
        description: 'The ID of the document to move',
      },
      category_id: {
        type: ['number', 'null'],
        description: 'The ID of the target category, or null to make the document uncategorized',
      },
    },
    required: ['document_id'],
  },
};

export async function handleMoveDocumentToCategory(
  api: FlowDotApiClient,
  args: { document_id: number; category_id?: number | null }
): Promise<CallToolResult> {
  try {
    await api.moveDocumentToCategory(args.document_id, args.category_id ?? null);

    const message = args.category_id
      ? `Document ${args.document_id} moved to category ${args.category_id}.`
      : `Document ${args.document_id} is now uncategorized.`;

    return {
      content: [{ type: 'text', text: message }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error moving document: ${errorMessage}` }],
      isError: true,
    };
  }
}
