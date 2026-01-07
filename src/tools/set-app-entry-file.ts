/**
 * set_app_entry_file Tool
 *
 * Set a file as the entry point for a multi-file FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const setAppEntryFileTool: Tool = {
  name: 'set_app_entry_file',
  description: `Set a file as the entry point for a multi-file FlowDot app.

The entry point is the main file that gets rendered when the app loads. Only one file can be the entry point at a time.

When you set a new entry point:
- The specified file becomes the entry point
- Any previous entry point is automatically unset

Use list_app_files to see which file is currently the entry point.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      file_path: {
        type: 'string',
        description: 'The file path to set as entry point (e.g., "App.jsx")',
      },
    },
    required: ['app_id', 'file_path'],
  },
};

export async function handleSetAppEntryFile(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const filePath = String(args.file_path);

    const result = await client.setAppEntryFile(appId, filePath);

    const text = `# Entry Point Set Successfully

**File:** ${result.path}
**App:** ${appId}

This file is now the entry point for the app. When the app loads, this file's main component will be rendered.`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error setting entry point: ${message}` }],
      isError: true,
    };
  }
}
