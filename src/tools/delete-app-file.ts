/**
 * delete_app_file Tool
 *
 * Delete a file from a multi-file FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const deleteAppFileTool: Tool = {
  name: 'delete_app_file',
  description: `Delete a file from a multi-file FlowDot app.

Permanently removes the file from the app. This action cannot be undone.

Note: Deleting the entry point file will require you to set a new entry point using set_app_entry_file.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      file_path: {
        type: 'string',
        description: 'The file path to delete (e.g., "OldComponent.jsx")',
      },
    },
    required: ['app_id', 'file_path'],
  },
};

export async function handleDeleteAppFile(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const filePath = String(args.file_path);

    await client.deleteAppFile(appId, filePath);

    const text = `# File Deleted Successfully

**Path:** ${filePath}
**App:** ${appId}

The file has been permanently removed from the app.`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting app file: ${message}` }],
      isError: true,
    };
  }
}
