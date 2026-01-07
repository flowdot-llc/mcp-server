/**
 * update_app_file Tool
 *
 * Update an existing file in a multi-file FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { UpdateAppFileInput } from '../types.js';

export const updateAppFileTool: Tool = {
  name: 'update_app_file',
  description: `Update the content of an existing file in a FlowDot app.

Updates the file's content and optionally its type. Use this for making changes to existing files.

For surgical edits (find/replace), consider using edit_app_code instead.

File constraints:
- Max file size: 100KB per file
- Max total app size: 512KB across all files`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      file_path: {
        type: 'string',
        description: 'The file path to update (e.g., "App.jsx", "components/Button.jsx")',
      },
      content: {
        type: 'string',
        description: 'The new file content',
      },
      type: {
        type: 'string',
        enum: ['component', 'hook', 'utility', 'page', 'context', 'style'],
        description: 'The file type (optional)',
      },
    },
    required: ['app_id', 'file_path', 'content'],
  },
};

export async function handleUpdateAppFile(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const filePath = String(args.file_path);
    const input: UpdateAppFileInput = {
      content: String(args.content),
    };

    if (args.type) {
      input.type = args.type as UpdateAppFileInput['type'];
    }

    const result = await client.updateAppFile(appId, filePath, input);

    const text = `# File Updated Successfully

**Path:** ${result.path}
**Type:** ${result.type}
**Entry Point:** ${result.is_entry ? 'Yes' : 'No'}
**Updated:** ${result.updated_at}

The file has been updated in app ${appId}.`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error updating app file: ${message}` }],
      isError: true,
    };
  }
}
