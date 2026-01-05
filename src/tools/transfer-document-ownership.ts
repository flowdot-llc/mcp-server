/**
 * Transfer Document Ownership Tool
 *
 * Transfers a document between personal and team knowledge bases.
 * Can also optionally change the category during transfer.
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const transferDocumentOwnershipToolDef: Tool = {
  name: 'transfer_document_ownership',
  description:
    'Transfer a document between your personal knowledge base and a team knowledge base. You can also optionally assign a category in the target scope during transfer.',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'number',
        description: 'The document ID to transfer',
      },
      team_id: {
        type: ['number', 'null'],
        description:
          'Target team ID to transfer to, or null/omit to transfer to personal. Use list_user_teams to see available teams.',
      },
      category_id: {
        type: ['number', 'null'],
        description:
          'Optional category ID in the target scope. Must belong to the target team (or personal if transferring to personal). Set to null to remove category.',
      },
    },
    required: ['document_id'],
  },
};

export async function handleTransferDocumentOwnership(
  api: FlowDotApiClient,
  args: {
    document_id: number;
    team_id?: number | null;
    category_id?: number | null;
  }
): Promise<CallToolResult> {
  try {
    const result = await api.transferDocumentOwnership(args.document_id, {
      team_id: args.team_id,
      category_id: args.category_id,
    });

    const lines = ['## Document Transferred Successfully', ''];
    lines.push(result.message);
    lines.push('');
    lines.push('### Document Details');
    lines.push(`- **ID:** ${result.document.id}`);
    lines.push(`- **Hash:** ${result.document.hash}`);
    lines.push(`- **Title:** ${result.document.title}`);

    if (result.document.team_id) {
      lines.push(`- **Team:** ${result.document.team_name} (ID: ${result.document.team_id})`);
    } else {
      lines.push(`- **Location:** Personal knowledge base`);
    }

    if (result.document.category_id) {
      lines.push(`- **Category ID:** ${result.document.category_id}`);
    } else {
      lines.push(`- **Category:** Uncategorized`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error transferring document: ${message}` }],
      isError: true,
    };
  }
}
