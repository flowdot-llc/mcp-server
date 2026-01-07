/**
 * get_app_file Tool
 *
 * Get a specific file from a multi-file FlowDot app.
 * Required scope: apps:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const getAppFileTool: Tool = {
  name: 'get_app_file',
  description: `Get the content and details of a specific file in a multi-file FlowDot app.

Returns the file's:
- Path
- Content (full source code)
- Type (component, hook, utility, page, context, style)
- Entry point status

Use list_app_files first to see available files in the app.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
      file_path: {
        type: 'string',
        description: 'The file path within the app (e.g., "App.jsx", "components/Button.jsx")',
      },
    },
    required: ['app_id', 'file_path'],
  },
};

export async function handleGetAppFile(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);
    const filePath = String(args.file_path);

    const file = await client.getAppFile(appId, filePath);

    // Determine file language for syntax highlighting
    const ext = filePath.split('.').pop()?.toLowerCase() || 'text';
    const langMap: Record<string, string> = {
      jsx: 'jsx',
      tsx: 'tsx',
      js: 'javascript',
      ts: 'typescript',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    const lang = langMap[ext] || 'text';

    const entryBadge = file.is_entry ? ' [ENTRY POINT]' : '';

    const text = `# ${filePath}${entryBadge}

**Type:** ${file.type}
**Entry Point:** ${file.is_entry ? 'Yes' : 'No'}
**Created:** ${file.created_at || 'N/A'}
**Updated:** ${file.updated_at || 'N/A'}

## Content

\`\`\`${lang}
${file.content}
\`\`\`
`;

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error getting app file: ${message}` }],
      isError: true,
    };
  }
}
