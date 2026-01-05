/**
 * List Knowledge Categories Tool
 *
 * Lists all document categories in the user's knowledge base.
 * Supports filtering by team or personal categories only.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listKnowledgeCategoriesToolDef: Tool = {
  name: 'list_knowledge_categories',
  description:
    'List all document categories in your knowledge base. Categories help organize documents for easier retrieval and targeted RAG queries. By default, shows both personal and team categories.',
  inputSchema: {
    type: 'object',
    properties: {
      team_id: {
        type: 'number',
        description: 'Optional: Filter to categories from a specific team only. Use list_user_teams to see available teams.',
      },
      personal: {
        type: 'boolean',
        description: 'Optional: Set to true to show only personal categories (excludes team categories).',
      },
    },
    required: [],
  },
};

export async function handleListKnowledgeCategories(
  api: FlowDotApiClient,
  args?: { team_id?: number; personal?: boolean }
): Promise<CallToolResult> {
  try {
    const categories = await api.listKnowledgeCategories({
      team_id: args?.team_id,
      personal: args?.personal,
    });

    if (categories.length === 0) {
      let message = 'No knowledge base categories found.';
      if (args?.team_id) {
        message = `No categories found for team ID ${args.team_id}.`;
      } else if (args?.personal) {
        message = 'No personal categories found.';
      }
      message += ' Use create_knowledge_category to create your first category.';

      return {
        content: [{ type: 'text', text: message }],
      };
    }

    // Separate personal and team categories for display
    const personalCategories = categories.filter(c => !c.team_id);
    const teamCategories = categories.filter(c => c.team_id);

    const lines = [
      `## Knowledge Base Categories (${categories.length} total)`,
      '',
    ];

    // Show personal categories
    if (personalCategories.length > 0 && !args?.team_id) {
      lines.push('### Personal Categories');
      lines.push('');
      for (const category of personalCategories) {
        lines.push(`#### ${category.name}`);
        lines.push(`- **ID:** ${category.id}`);
        lines.push(`- **Slug:** ${category.slug}`);
        if (category.description) {
          lines.push(`- **Description:** ${category.description}`);
        }
        lines.push(`- **Color:** ${category.color}`);
        lines.push(`- **Documents:** ${category.document_count}`);
        lines.push('');
      }
    }

    // Show team categories
    if (teamCategories.length > 0 && !args?.personal) {
      // Group by team
      const byTeam = new Map<number, typeof teamCategories>();
      for (const cat of teamCategories) {
        const teamId = cat.team_id!;
        if (!byTeam.has(teamId)) {
          byTeam.set(teamId, []);
        }
        byTeam.get(teamId)!.push(cat);
      }

      for (const [teamId, cats] of byTeam) {
        const teamName = cats[0].team_name || `Team ${teamId}`;
        lines.push(`### Team: ${teamName} (ID: ${teamId})`);
        lines.push('');

        for (const category of cats) {
          lines.push(`#### ${category.name}`);
          lines.push(`- **ID:** ${category.id}`);
          lines.push(`- **Slug:** ${category.slug}`);
          if (category.description) {
            lines.push(`- **Description:** ${category.description}`);
          }
          lines.push(`- **Color:** ${category.color}`);
          lines.push(`- **Documents:** ${category.document_count}`);
          lines.push('');
        }
      }
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
