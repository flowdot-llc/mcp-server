/**
 * list_app_files Tool
 *
 * List all files in a multi-file FlowDot app.
 * Required scope: apps:read
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { FlowDotApiClient } from '../api-client.js';

export const listAppFilesTool: Tool = {
  name: 'list_app_files',
  description: `List all files in a multi-file FlowDot app.

Returns a list of files with their paths, types, and entry point status.

Multi-file apps allow organizing React code across multiple files:
- Component files (.jsx, .tsx)
- Utility files (.js, .ts)
- Style files (.css)
- JSON configuration files

Use get_app_file to retrieve the content of a specific file.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      app_id: {
        type: 'string',
        description: 'The app ID (hash)',
      },
    },
    required: ['app_id'],
  },
};

export async function handleListAppFiles(
  client: FlowDotApiClient,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const appId = String(args.app_id);

    const files = await client.listAppFiles(appId);

    if (files.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No files found in app ${appId}.\n\nUse create_app_file to add files to this app.`,
        }],
      };
    }

    // Group files by directory
    const filesByDir: Record<string, typeof files> = {};
    for (const file of files) {
      const dir = file.path.includes('/')
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : '(root)';
      if (!filesByDir[dir]) {
        filesByDir[dir] = [];
      }
      filesByDir[dir].push(file);
    }

    // Format output
    let text = `# Files in App ${appId}\n\n`;
    text += `**Total Files:** ${files.length}\n\n`;

    // Find entry point
    const entryFile = files.find(f => f.is_entry);
    if (entryFile) {
      text += `**Entry Point:** ${entryFile.path}\n\n`;
    }

    text += `## File List\n\n`;

    for (const [dir, dirFiles] of Object.entries(filesByDir).sort()) {
      text += `### ${dir}/\n\n`;
      for (const file of dirFiles.sort((a, b) => a.path.localeCompare(b.path))) {
        const entryBadge = file.is_entry ? ' [ENTRY]' : '';
        const typeBadge = file.type ? ` (${file.type})` : '';
        text += `- \`${file.path}\`${typeBadge}${entryBadge}\n`;
      }
      text += '\n';
    }

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing app files: ${message}` }],
      isError: true,
    };
  }
}
