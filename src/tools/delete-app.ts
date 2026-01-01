/**
 * delete_app Tool
 *
 * Delete an app permanently.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteAppTool: Tool = {
  name: 'delete_app',
  description: `Permanently delete an app. This action cannot be undone.

The app and all its associated data (comments, votes, etc.) will be removed.
Existing clones of the app will continue to work for their owners.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash) to delete',
      },
    },
    required: ['app_id'],
  },
};

export async function handleDeleteApp(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);

    await client.deleteApp(appId);

    return {
      content: [{ type: 'text', text: `App ${appId} deleted successfully.` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting app: ${message}` }],
      isError: true,
    };
  }
}
