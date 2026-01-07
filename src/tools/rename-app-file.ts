/**
 * rename_app_file Tool
 *
 * Rename or move a file in a multi-file FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const renameAppFileTool: Tool = {
  name: 'rename_app_file',
  description: `Rename or move a file within a multi-file FlowDot app.

Changes the file's path while preserving its content. Can be used to:
- Rename a file (e.g., "Button.jsx" -> "PrimaryButton.jsx")
- Move to a different directory (e.g., "Button.jsx" -> "components/Button.jsx")
- Both rename and move at once

File constraints:
- Allowed extensions: jsx, js, tsx, ts, css, json, md
- No path traversal (../) allowed
- No hidden files (starting with .)`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      file_path: {
        type: 'string',
        description: 'The current file path',
      },
      new_path: {
        type: 'string',
        description: 'The new file path',
      },
    },
    required: ['app_id', 'file_path', 'new_path'],
  },
};

export async function handleRenameAppFile(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const filePath = String(args.file_path);
    const newPath = String(args.new_path);

    const result = await client.renameAppFile(appId, filePath, { new_path: newPath });

    const text = `# File Renamed Successfully

**Old Path:** ${filePath}
**New Path:** ${result.path}
**App:** ${appId}

The file has been renamed/moved successfully.`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error renaming app file: ${message}` }],
      isError: true,
    };
  }
}
