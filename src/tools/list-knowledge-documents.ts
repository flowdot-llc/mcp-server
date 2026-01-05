/**
 * List Knowledge Documents Tool
 *
 * Lists documents in the user's knowledge base with optional filtering.
 * Includes both personal and team documents.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listKnowledgeDocumentsToolDef: Tool = {
  name: 'list_knowledge_documents',
  description:
    'List documents in your knowledge base. Optionally filter by category, team, or status. Shows document title, status, size, and chunk count. By default shows all accessible documents (personal and team).',
  inputSchema: {
    type: 'object',
    properties: {
      category_id: {
        type: 'number',
        description: 'Filter documents by category ID (optional)',
      },
      team_id: {
        type: ['number', 'string'],
        description: 'Filter documents by team. Use a team ID (number) to show only that team\'s documents, or "personal" to show only personal documents. Use list_user_teams to see available teams.',
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
  args: {
    category_id?: number;
    team_id?: number | 'personal';
    status?: 'pending' | 'processing' | 'ready' | 'failed';
  }
): Promise<CallToolResult> {
  try {
    const documents = await api.listKnowledgeDocuments({
      category_id: args.category_id,
      team_id: args.team_id,
      status: args.status,
    });

    if (documents.length === 0) {
      let message = 'No documents found in your knowledge base.';
      if (args.category_id || args.status || args.team_id) {
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

    // Group documents by personal vs team
    const personalDocs = documents.filter(d => !d.is_team_document);
    const teamDocs = documents.filter(d => d.is_team_document);

    const lines = [
      `## Knowledge Base Documents (${documents.length} total)`,
      '',
    ];

    const formatDoc = (doc: typeof documents[0]) => {
      const docLines: string[] = [];
      docLines.push(`### ${statusIcon(doc.status)} ${doc.title}`);
      docLines.push(`- **ID:** ${doc.id} | **Hash:** ${doc.hash}`);
      docLines.push(`- **Status:** ${doc.status}${doc.processing_error ? ` (Error: ${doc.processing_error})` : ''}`);
      docLines.push(`- **Size:** ${doc.formatted_size} | **Chunks:** ${doc.chunk_count} | **Tokens:** ${doc.token_count}`);
      docLines.push(`- **Type:** ${doc.mime_type}`);
      if (doc.category) {
        docLines.push(`- **Category:** ${doc.category.name}`);
      }
      if (doc.has_embeddings) {
        docLines.push(`- **Embeddings:** Available`);
      }
      if (!doc.can_edit) {
        docLines.push(`- **Access:** Read-only`);
      }
      docLines.push(`- **Created:** ${doc.created_at}`);
      docLines.push('');
      return docLines;
    };

    // Show personal documents
    if (personalDocs.length > 0 && args.team_id !== 'personal' || args.team_id === undefined) {
      if (!args.team_id || args.team_id === 'personal') {
        lines.push('### Personal Documents');
        lines.push('');
        for (const doc of personalDocs) {
          lines.push(...formatDoc(doc));
        }
      }
    }

    // Show team documents grouped by team
    if (teamDocs.length > 0 && args.team_id !== 'personal') {
      const byTeam = new Map<number, typeof teamDocs>();
      for (const doc of teamDocs) {
        const teamId = doc.team_id!;
        if (!byTeam.has(teamId)) {
          byTeam.set(teamId, []);
        }
        byTeam.get(teamId)!.push(doc);
      }

      for (const [teamId, docs] of byTeam) {
        const teamName = docs[0].team?.name || `Team ${teamId}`;
        lines.push(`### Team: ${teamName} (ID: ${teamId})`);
        lines.push('');
        for (const doc of docs) {
          lines.push(...formatDoc(doc));
        }
      }
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
