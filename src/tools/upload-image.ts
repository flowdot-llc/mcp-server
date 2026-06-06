/**
 * Upload Image Tool
 *
 * Uploads a base64 image to the user's FlowDot storage bucket and returns a
 * public direct URL. Raster only (png/jpeg/webp); counts toward storage quota.
 */

import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { FlowDotApiClient } from '../api-client.js';

export const uploadImageToolDef: Tool = {
  name: 'upload_image',
  description:
    'Upload an image (bare base64) to your FlowDot storage bucket and get back a public direct URL you can embed anywhere (e.g. a toolkit README). The image is persisted to your account and counts toward your storage quota. Raster formats only: image/png, image/jpeg, image/webp. SVG is NOT accepted — rasterize vector art to PNG first (e.g. with the image tools svg_to_png).',
  inputSchema: {
    type: 'object',
    properties: {
      image_base64: {
        type: 'string',
        description: 'The image as bare base64 (NOT a data: URL).',
      },
      mime_type: {
        type: 'string',
        enum: ['image/png', 'image/jpeg', 'image/webp'],
        description: 'MIME type of the image. Raster only (no SVG).',
      },
      label: {
        type: 'string',
        description: 'Optional label stored with the image for your own reference.',
      },
    },
    required: ['image_base64', 'mime_type'],
  },
};

export async function handleUploadImage(
  api: FlowDotApiClient,
  args: { image_base64: string; mime_type: 'image/png' | 'image/jpeg' | 'image/webp'; label?: string }
): Promise<CallToolResult> {
  try {
    const result = await api.uploadImage({
      image_base64: args.image_base64,
      mime_type: args.mime_type,
      label: args.label,
    });

    const lines = [
      '## Image Uploaded',
      '',
      `**URL:** ${result.url}`,
      `**ID:** ${result.id}`,
      `**Type:** ${result.mime_type}`,
      `**Size:** ${result.size_bytes} bytes`,
      '',
      'The URL is a public direct link — embed it directly (e.g. `![](url)` in markdown).',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error uploading image: ${message}` }],
      isError: true,
    };
  }
}
