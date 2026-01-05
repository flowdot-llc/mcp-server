/**
 * Update Knowledge Category Tool
 *
 * Updates an existing document category.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const updateKnowledgeCategoryToolDef: Tool = {
  name: 'update_knowledge_category',
  description: 'Update an existing knowledge base category name, description, or color.',
  inputSchema: {
    type: 'object',
    properties: {
      category_id: {
        type: 'number',
        description: 'The ID of the category to update',
      },
      name: {
        type: 'string',
        description: 'New name for the category (max 100 characters)',
      },
      description: {
        type: 'string',
        description: 'New description (max 500 characters)',
      },
      color: {
        type: 'string',
        description: 'New hex color code (e.g., #3B82F6)',
        pattern: '^#[0-9A-Fa-f]{6}$',
      },
    },
    required: ['category_id'],
  },
};

export async function handleUpdateKnowledgeCategory(
  api: FlowDotApiClient,
  args: { category_id: number; name?: string; description?: string; color?: string }
): Promise<CallToolResult> {
  try {
    const updates: { name?: string; description?: string; color?: string } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;

    if (Object.keys(updates).length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No updates provided. Specify at least one of: name, description, or color.',
          },
        ],
        isError: true,
      };
    }

    const category = await api.updateKnowledgeCategory(args.category_id, updates);

    return {
      content: [
        {
          type: 'text',
          text: `Category "${category.name}" (ID: ${category.id}) updated successfully.\n\n` +
            `**Name:** ${category.name}\n` +
            `**Description:** ${category.description || 'None'}\n` +
            `**Color:** ${category.color}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating category: ${message}` }],
      isError: true,
    };
  }
}
