/**
 * List Knowledge Categories Tool
 *
 * Lists all document categories in the user's knowledge base.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listKnowledgeCategoriesToolDef: Tool = {
  name: 'list_knowledge_categories',
  description:
    'List all document categories in your knowledge base. Categories help organize documents for easier retrieval and targeted RAG queries.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function handleListKnowledgeCategories(
  api: FlowDotApiClient
): Promise<CallToolResult> {
  try {
    const categories = await api.listKnowledgeCategories();

    if (categories.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No knowledge base categories found. Use create_knowledge_category to create your first category.',
          },
        ],
      };
    }

    const lines = [
      `## Knowledge Base Categories (${categories.length})`,
      '',
    ];

    for (const category of categories) {
      lines.push(`### ${category.name}`);
      lines.push(`- **ID:** ${category.id}`);
      lines.push(`- **Slug:** ${category.slug}`);
      if (category.description) {
        lines.push(`- **Description:** ${category.description}`);
      }
      lines.push(`- **Color:** ${category.color}`);
      lines.push(`- **Documents:** ${category.document_count}`);
      lines.push(`- **Created:** ${category.created_at}`);
      lines.push('');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing categories: ${message}` }],
      isError: true,
    };
  }
}
