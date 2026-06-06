/**
 * List Images Tool
 *
 * Lists the images you have uploaded to your FlowDot storage bucket.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const listImagesToolDef: Tool = {
  name: 'list_images',
  description:
    'List images you have uploaded to your FlowDot storage bucket (most recent first), with their public URLs, ids, MIME types, and sizes.',
  inputSchema: {
    type: 'object',
    properties: {
      per_page: {
        type: 'number',
        description: 'Max images to return (default 30, max 100).',
      },
    },
  },
};

export async function handleListImages(
  api: FlowDotApiClient,
  args: { per_page?: number }
): Promise<CallToolResult> {
  try {
    const images = await api.listImages(args.per_page);

    if (!images.length) {
      return { content: [{ type: 'text', text: 'No images uploaded yet.' }] };
    }

    const lines = [`## Your Images (${images.length})`, ''];
    for (const img of images) {
      lines.push(`- **#${img.id}** ${img.url} (${img.mime_type}, ${img.size_bytes} bytes)`);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error listing images: ${message}` }],
      isError: true,
    };
  }
}
