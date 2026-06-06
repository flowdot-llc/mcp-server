/**
 * Delete Image Tool
 *
 * Deletes one of your uploaded images (removes the stored object and frees quota).
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const deleteImageToolDef: Tool = {
  name: 'delete_image',
  description:
    'Delete one of your uploaded images by id. Removes the stored file and frees the storage it used. Only your own images can be deleted.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The image id (from upload_image or list_images).',
      },
    },
    required: ['id'],
  },
};

export async function handleDeleteImage(
  api: FlowDotApiClient,
  args: { id: number }
): Promise<CallToolResult> {
  try {
    await api.deleteImage(args.id);
    return { content: [{ type: 'text', text: `Image #${args.id} deleted.` }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error deleting image: ${message}` }],
      isError: true,
    };
  }
}
