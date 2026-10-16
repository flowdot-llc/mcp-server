/**
 * List Files Tool
 *
 * Lists the files in your FlowDot storage bucket: images uploaded or generated, and audio
 * and other files saved by toolkit tools (Docs/TOOLKIT_FILES.md).
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listFilesToolDef: Tool = {
  name: 'list_files',
  description:
    'List the files in your FlowDot storage bucket (images uploaded or generated, audio and other files saved by toolkit tools), most recent first, with public URLs, ids, MIME types and sizes.',
  inputSchema: {
    type: 'object',
    properties: {
      per_page: {
        type: 'number',
        description: 'Max files to return (default 30, max 100).',
      },
    },
  },
};

export async function handleListFiles(
  api: FlowDotApiClient,
  args: { per_page?: number }
): Promise<CallToolResult> {
  try {
    const files = await api.listFiles(args.per_page);

    if (!files.length) {
      return { content: [{ type: 'text', text: 'No files in your bucket yet.' }] };
    }

    const lines = [`## Your Files (${files.length})`, ''];
    for (const file of files) {
      lines.push(`- **#${file.id}** ${file.url} (${file.mime_type}, ${file.size_bytes} bytes)`);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing files: ${message}` }],
      isError: true,
    };
  }
}
