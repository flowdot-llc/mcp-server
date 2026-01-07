/**
 * create_app_file Tool
 *
 * Create a new file in a multi-file FlowDot app.
 * Required scope: apps:manage
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';
import { CreateAppFileInput } from '../types.js';

export const createAppFileTool: Tool = {
  name: 'create_app_file',
  description: `Create a new file in a multi-file FlowDot app.

Creates a new file with the specified path and content.

File constraints:
- Max file size: 100KB per file
- Max total app size: 512KB across all files
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
      path: {
        type: 'string',
        description: 'The file path (e.g., "Button.jsx", "components/Modal.jsx")',
      },
      content: {
        type: 'string',
        description: 'The file content (source code)',
      },
      type: {
        type: 'string',
        enum: ['component', 'hook', 'utility', 'page', 'context', 'style'],
        description: 'The file type (default: component)',
      },
      is_entry: {
        type: 'boolean',
        description: 'Set this file as the app entry point (default: false)',
      },
    },
    required: ['app_id', 'path', 'content'],
  },
};

export async function handleCreateAppFile(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const input: CreateAppFileInput = {
      path: String(args.path),
      content: String(args.content),
    };

    if (args.type) {
      input.type = args.type as CreateAppFileInput['type'];
    }
    if (typeof args.is_entry === 'boolean') {
      input.is_entry = args.is_entry;
    }

    const result = await client.createAppFile(appId, input);

    const text = `# File Created Successfully

**Path:** ${result.path}
**Type:** ${result.type}
**Entry Point:** ${result.is_entry ? 'Yes' : 'No'}
**Created:** ${result.created_at}

The file has been added to app ${appId}.

${result.is_entry ? 'This file is now the entry point for the app.' : ''}`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error creating app file: ${message}` }],
      isError: true,
    };
  }
}
